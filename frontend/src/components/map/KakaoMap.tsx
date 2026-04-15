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
  onBubbleClick?: (transactions: Transaction[]) => void
}

interface BubbleEntry {
  overlay: any
  transactions: Transaction[]
}

export default function KakaoMap({ region, transactions, hoveredTransactionId, onBubbleClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const bubblesRef = useRef<Map<string, BubbleEntry>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return

    let settled = false

    const createMap = () => {
      const w = window as any
      if (!containerRef.current) return
      try {
        const center = new w.kakao.maps.LatLng(
          region?.lat || 37.5665,
          region?.lng || 126.9780,
        )
        mapRef.current = new w.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
        })
        settled = true
        setStatus('ready')
      } catch {
        settled = true
        setStatus('error')
      }
    }

    const tryInit = () => {
      const w = window as any
      if (!w.kakao?.maps) return false
      try {
        w.kakao.maps.load(createMap)
        return true
      } catch {
        settled = true
        setStatus('error')
        return true
      }
    }

    // 12초 안에 SDK 로드 안 되면 에러
    const timeout = setTimeout(() => {
      if (!settled) setStatus('error')
    }, 12000)

    if (!tryInit()) {
      const id = setInterval(() => {
        if (tryInit()) clearInterval(id)
      }, 300)
      return () => { clearInterval(id); clearTimeout(timeout) }
    }

    return () => clearTimeout(timeout)
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

  // Rebuild bubble markers when transactions change
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const w = window as any

    // Clear existing bubbles
    bubblesRef.current.forEach(({ overlay }) => {
      overlay.setMap(null)
    })
    bubblesRef.current.clear()

    // Filter valid coordinates
    const valid = transactions.filter(
      (t) => t.lat && t.lng && !(t.lat === 0 && t.lng === 0),
    )

    // Group by building name (same building => one bubble)
    const grouped = new Map<string, Transaction[]>()
    valid.forEach((t) => {
      const key = `${t.buildingName}||${t.address}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(t)
    })

    grouped.forEach((txs, key) => {
      // Sort by date desc, take the most recent for display
      const sorted = [...txs].sort((a, b) => b.dealDate.localeCompare(a.dealDate))
      const representative = sorted[0]

      const position = new w.kakao.maps.LatLng(representative.lat, representative.lng)

      const isOfficetel = representative.propertyType === 'officetel'
      const bgColor = isOfficetel ? '#7c3aed' : '#f97316'
      const priceText = formatPrice(representative.dealAmount)
      const areaText = `${representative.exclusiveArea}㎡`

      const bubbleEl = document.createElement('div')
      bubbleEl.style.cssText = [
        `background:${bgColor}`,
        'border-radius:20px',
        'padding:5px 11px',
        'color:white',
        'font-size:12px',
        'font-weight:700',
        'cursor:pointer',
        'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
        'border:2px solid rgba(255,255,255,0.45)',
        'white-space:nowrap',
        'text-align:center',
        'line-height:1.3',
        'user-select:none',
        'transition:transform 0.15s,box-shadow 0.15s',
      ].join(';')
      bubbleEl.innerHTML = `${priceText}<br><span style="font-size:10px;opacity:0.85;font-weight:500">${areaText}</span>`

      bubbleEl.addEventListener('mouseenter', () => {
        bubbleEl.style.transform = 'scale(1.08)'
        bubbleEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.45)'
      })
      bubbleEl.addEventListener('mouseleave', () => {
        bubbleEl.style.transform = 'scale(1)'
        bubbleEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)'
      })
      bubbleEl.addEventListener('click', () => {
        if (onBubbleClick) onBubbleClick(sorted)
      })

      const overlay = new w.kakao.maps.CustomOverlay({
        position,
        content: bubbleEl,
        map: mapRef.current,
        zIndex: 3,
        yAnchor: 1.3,
      })

      bubblesRef.current.set(key, { overlay, transactions: sorted })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, status])

  // hoveredTransactionId — no-op kept for interface compatibility
  useEffect(() => {
    if (status !== 'ready' || hoveredTransactionId === null) return
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            페이지 새로고침
          </button>
          <span className="text-xs text-slate-600 mt-3">조회 결과 목록은 지도 없이도 정상 사용 가능합니다.</span>
        </div>
      )}
    </div>
  )
}
