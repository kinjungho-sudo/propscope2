'use client'

import { useEffect, useRef, useState } from 'react'
import { Transaction, Region } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Loader2, MapPin } from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface KakaoMapProps {
  region: Region | null
  transactions: Transaction[]
  hoveredTransactionId: string | null
}

interface MarkerEntry {
  marker: any
  overlay: any
}

export default function KakaoMap({ region, transactions, hoveredTransactionId }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = () => {
      const w = window as any
      if (!w.kakao?.maps || !containerRef.current) return false

      try {
        w.kakao.maps.load(() => {
          if (!containerRef.current) return
          const center = new w.kakao.maps.LatLng(
            region?.lat || 37.5665,
            region?.lng || 126.9780,
          )
          mapRef.current = new w.kakao.maps.Map(containerRef.current, {
            center,
            level: 5,
          })
          setStatus('ready')
        })
        return true
      } catch {
        setStatus('error')
        return true
      }
    }

    if (!initMap()) {
      const id = setInterval(() => {
        if (initMap()) clearInterval(id)
      }, 300)
      return () => clearInterval(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recenter map when region changes
  useEffect(() => {
    if (!mapRef.current || !region) return
    const w = window as any
    const center = new w.kakao.maps.LatLng(region.lat, region.lng)
    mapRef.current.setCenter(center)
    mapRef.current.setLevel(5)
  }, [region])

  // Rebuild markers when transactions change
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const w = window as any

    // Clear existing markers
    markersRef.current.forEach(({ marker, overlay }) => {
      marker.setMap(null)
      overlay.setMap(null)
    })
    markersRef.current.clear()

    // Only transactions with valid coordinates
    const valid = transactions.filter(
      (t) => t.lat && t.lng && !(t.lat === 0 && t.lng === 0),
    )

    valid.forEach((t) => {
      const position = new w.kakao.maps.LatLng(t.lat, t.lng)

      const marker = new w.kakao.maps.Marker({ position, map: mapRef.current })

      // Popup overlay (hidden by default)
      const el = document.createElement('div')
      el.style.cssText = [
        'background:white',
        'border:1.5px solid #e5e7eb',
        'border-radius:8px',
        'padding:8px 12px',
        'font-size:12px',
        'white-space:nowrap',
        'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
        'transform:translateY(calc(-100% - 16px))',
        'pointer-events:none',
        'line-height:1.5',
      ].join(';')
      el.innerHTML = `
        <div style="font-weight:600;color:#111827">${t.buildingName}</div>
        <div style="color:#6b7280;margin-top:2px">${formatPrice(t.dealAmount)} · ${t.floor}층</div>
      `

      const overlay = new w.kakao.maps.CustomOverlay({
        position,
        content: el,
        map: null,
        zIndex: 3,
      })

      w.kakao.maps.event.addListener(marker, 'mouseover', () => overlay.setMap(mapRef.current))
      w.kakao.maps.event.addListener(marker, 'mouseout', () => overlay.setMap(null))

      markersRef.current.set(t.id, { marker, overlay })
    })
  }, [transactions, status])

  // Highlight marker when list item is hovered
  useEffect(() => {
    if (status !== 'ready') return
    markersRef.current.forEach(({ overlay }, id) => {
      overlay.setMap(id === hoveredTransactionId ? mapRef.current : null)
    })
  }, [hoveredTransactionId, status])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
          <span className="text-sm text-gray-400">지도 로딩 중...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mb-2" />
          <span className="text-sm text-gray-500 font-medium">지도를 불러올 수 없습니다</span>
          <span className="text-xs text-gray-400 mt-2 leading-relaxed">
            Kakao Developers 콘솔 → 플랫폼 → Web 에서<br />
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
              {typeof window !== 'undefined' ? window.location.origin : ''}
            </code><br />
            도메인을 등록하면 지도가 표시됩니다.
          </span>
          <span className="text-xs text-gray-300 mt-3">📋 지도 없이도 조회 결과 목록은 정상 사용 가능합니다.</span>
        </div>
      )}
    </div>
  )
}
