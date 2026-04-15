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

/** 건물명 해시 기반 결정적 오프셋 (동일 건물 = 항상 같은 위치, ±300m) */
function hashJitter(str: string, salt: number): number {
  let h = salt
  for (const c of str) h = ((h * 31) + c.charCodeAt(0)) & 0x7fffffff
  return ((h % 600) - 300) / 100000
}

export default function KakaoMap({ region, transactions, hoveredTransactionId, onBubbleClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const bubblesRef = useRef<Map<string, BubbleEntry>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  // geocoding으로 얻은 region 중심 좌표 (region.lat/lng가 null일 때 사용)
  const [geoCenter, setGeoCenter] = useState<{ lat: number; lng: number } | null>(null)

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

  // Region 변경 시 지도 이동
  useEffect(() => {
    if (!mapRef.current || !region || status !== 'ready') return
    const w = window as any

    if (region.lat && region.lng) {
      // DB에 좌표 있음 → 바로 이동
      const center = new w.kakao.maps.LatLng(region.lat, region.lng)
      mapRef.current.setCenter(center)
      mapRef.current.setLevel(5)
      setGeoCenter({ lat: region.lat, lng: region.lng })
    } else if (w.kakao?.maps?.services) {
      // DB에 좌표 없음 → 주소로 geocoding
      const geocoder = new w.kakao.maps.services.Geocoder()
      const address = `${region.sidoName} ${region.sigunguName} ${region.dongName}`
      geocoder.addressSearch(address, (result: any[], stat: string) => {
        if (stat === w.kakao.maps.services.Status.OK && result.length > 0) {
          const lat = parseFloat(result[0].y)
          const lng = parseFloat(result[0].x)
          const center = new w.kakao.maps.LatLng(lat, lng)
          mapRef.current?.setCenter(center)
          mapRef.current?.setLevel(5)
          setGeoCenter({ lat, lng })
        }
      })
    }
  }, [region, status])

  // transactions 변경 시 버블 마커 재구성
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const w = window as any

    // 기존 버블 제거
    bubblesRef.current.forEach(({ overlay }) => overlay.setMap(null))
    bubblesRef.current.clear()

    // 유효 좌표 필터링 — geoCenter를 폴백으로 사용
    const base = geoCenter
    const valid = transactions
      .map((t) => {
        const rawLat = (t as any).lat as number | null
        const rawLng = (t as any).lng as number | null
        if (rawLat && rawLng && !(rawLat === 0 && rawLng === 0)) {
          return { ...t, lat: rawLat, lng: rawLng }
        }
        if (base) {
          return {
            ...t,
            lat: base.lat + hashJitter(t.buildingName, 1),
            lng: base.lng + hashJitter(t.buildingName, 2),
          }
        }
        return null
      })
      .filter((t): t is Transaction & { lat: number; lng: number } => t !== null)

    // 건물별 그룹핑
    const grouped = new Map<string, (Transaction & { lat: number; lng: number })[]>()
    valid.forEach((t) => {
      const key = `${t.buildingName}||${t.address}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(t)
    })

    grouped.forEach((txs) => {
      const sorted = [...txs].sort((a, b) => b.dealDate.localeCompare(a.dealDate))
      const rep = sorted[0]
      const position = new w.kakao.maps.LatLng(rep.lat, rep.lng)

      const isOfficetel = rep.propertyType === 'officetel'
      const bgColor = isOfficetel ? '#7c3aed' : '#f97316'
      const priceText = formatPrice(rep.dealAmount)
      const areaText = `${rep.exclusiveArea}㎡`

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

      bubblesRef.current.set(`${rep.buildingName}||${rep.address}`, { overlay, transactions: sorted })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, status, geoCenter])

  // hoveredTransactionId — 인터페이스 호환용
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
        </div>
      )}
    </div>
  )
}
