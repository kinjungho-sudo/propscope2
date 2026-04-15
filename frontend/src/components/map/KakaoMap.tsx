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
  onTransactionClick?: (tx: Transaction) => void
}

interface MarkerEntry {
  marker: any
  overlay: any       // detail overlay (click)
  labelOverlay?: any // price label (always visible)
}

export default function KakaoMap({ region, transactions, hoveredTransactionId, onTransactionClick }: KakaoMapProps) {
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
      // 12초 후에도 로드 안 되면 error 처리
      const timeout = setTimeout(() => {
        clearInterval(id)
        setStatus('error')
      }, 12000)
      return () => { clearInterval(id); clearTimeout(timeout) }
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
    markersRef.current.forEach(({ marker, overlay, labelOverlay }) => {
      marker.setMap(null)
      overlay.setMap(null)
      labelOverlay?.setMap(null)
    })
    markersRef.current.clear()

    // Only transactions with valid coordinates
    const valid = transactions.filter(
      (t) => t.lat && t.lng && !(t.lat === 0 && t.lng === 0),
    )

    valid.forEach((t) => {
      const position = new w.kakao.maps.LatLng(t.lat, t.lng)

      const marker = new w.kakao.maps.Marker({ position, map: mapRef.current })

      // 항상 표시되는 가격 라벨 (마커 위)
      const labelEl = document.createElement('div')
      labelEl.style.cssText = [
        'background:rgba(15,23,42,0.88)',
        'border:1px solid rgba(99,102,241,0.5)',
        'border-radius:6px',
        'padding:3px 7px',
        'font-size:11px',
        'font-weight:600',
        'white-space:nowrap',
        'color:#e2e8f0',
        'transform:translateY(calc(-100% - 38px))',
        'pointer-events:none',
        'line-height:1.4',
        'backdrop-filter:blur(4px)',
      ].join(';')
      labelEl.textContent = formatPrice(t.dealAmount)

      const labelOverlay = new w.kakao.maps.CustomOverlay({
        position,
        content: labelEl,
        map: mapRef.current,
        zIndex: 2,
      })

      // 클릭 시 상세 팝업 (더 큰 정보)
      const detailEl = document.createElement('div')
      detailEl.style.cssText = [
        'background:rgba(15,23,42,0.95)',
        'border:1.5px solid rgba(59,130,246,0.6)',
        'border-radius:10px',
        'padding:10px 14px',
        'font-size:12px',
        'white-space:nowrap',
        'box-shadow:0 4px 20px rgba(0,0,0,0.4)',
        'transform:translateY(calc(-100% - 38px))',
        'pointer-events:none',
        'line-height:1.6',
        'color:#f1f5f9',
      ].join(';')
      detailEl.innerHTML = `
        <div style="font-weight:700;color:#fff;margin-bottom:3px">${t.buildingName}</div>
        <div style="color:#94a3b8;font-size:11px">${t.address}</div>
        <div style="margin-top:5px;display:flex;gap:12px">
          <div><span style="color:#60a5fa;font-weight:600">${formatPrice(t.dealAmount)}</span><span style="color:#64748b;font-size:10px;margin-left:3px">${t.floor}층</span></div>
          <div style="color:#94a3b8;font-size:11px">${(t.exclusiveArea / 3.3058).toFixed(1)}평 · ${t.buildYear}년</div>
        </div>
      `

      const detailOverlay = new w.kakao.maps.CustomOverlay({
        position,
        content: detailEl,
        map: null,
        zIndex: 5,
      })

      w.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 모든 detail 닫기
        markersRef.current.forEach(({ overlay }) => overlay.setMap(null))
        detailOverlay.setMap(mapRef.current)
        if (onTransactionClick) onTransactionClick(t)
      })

      markersRef.current.set(t.id, { marker, overlay: detailOverlay, labelOverlay })
    })
  }, [transactions, status])

  // Highlight marker when list item is hovered (no-op when null)
  useEffect(() => {
    if (status !== 'ready' || hoveredTransactionId === null) return
    markersRef.current.forEach(({ overlay }, id) => {
      overlay.setMap(id === hoveredTransactionId ? mapRef.current : null)
    })
  }, [hoveredTransactionId, status])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1526]">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-2" />
          <span className="text-sm text-slate-400">지도 로딩 중...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1526] px-6 text-center">
          <MapPin className="w-8 h-8 text-slate-600 mb-2" />
          <span className="text-sm text-slate-400 font-medium">지도를 불러올 수 없습니다</span>
          <span className="text-xs text-slate-500 mt-2 leading-relaxed">
            Kakao Developers 콘솔 → 플랫폼 → Web 에서<br />
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {typeof window !== 'undefined' ? window.location.origin : ''}
            </code><br />
            도메인을 등록해주세요.
          </span>
          <span className="text-xs text-slate-600 mt-3">조회 결과 목록은 지도 없이도 정상 사용 가능합니다.</span>
        </div>
      )}
    </div>
  )
}
