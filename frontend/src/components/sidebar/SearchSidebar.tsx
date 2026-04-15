'use client'

import { useState, useRef } from 'react'
import { Search, RotateCcw, X, Clock, SlidersHorizontal, ChevronDown, TrendingUp, TrendingDown, Minus, DatabaseZap, Loader2 } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Region, TransactionStats } from '@/types'
import { useSearchStore } from '@/store/search'
import { formatPrice } from '@/lib/utils'
import axios from 'axios'

function DualRangeSlider({
  min, max, step = 1,
  value, onChange, format,
}: {
  min: number; max: number; step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  format: (v: number) => string
}) {
  const [lo, hi] = value
  const pctLo = ((lo - min) / (max - min)) * 100
  const pctHi = ((hi - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="relative h-5">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-slate-600 rounded" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => { const v = +e.target.value; if (v <= hi) onChange([v, hi]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ zIndex: lo > max - (max - min) * 0.1 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => { const v = +e.target.value; if (v >= lo) onChange([lo, v]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ zIndex: 4 }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctLo}% - 7px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctHi}% - 7px)` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(lo)}</span><span>{format(hi)}</span>
      </div>
    </div>
  )
}

interface SearchSidebarProps {
  stats?: TransactionStats | null
}

export default function SearchSidebar({ stats }: SearchSidebarProps) {
  const { filters, setFilters, resetFilters, setSelectedRegion, recentSearches } = useSearchStore()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Region[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [villaOn, setVillaOn] = useState(filters.propertyType === 'villa' || filters.propertyType === 'all')
  const [officetelOn, setOfficetelOn] = useState(filters.propertyType === 'officetel' || filters.propertyType === 'all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000])
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 200])
  const [buildYearRange, setBuildYearRange] = useState<[number, number]>([1970, new Date().getFullYear()])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 1) { setSuggestions([]); setIsOpen(value.length === 0); return }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await regionsApi.search(value)
        setSuggestions(res.data.data || [])
        setIsOpen(true)
      } catch { setSuggestions([]) }
      finally { setIsLoading(false) }
    }, 300)
  }

  const handleSelect = (region: Region) => {
    setQuery(region.fullName || `${region.sidoName} ${region.sigunguName} ${region.dongName}`)
    setSelectedRegion(region)
    setIsOpen(false)
  }

  const handleSearch = () => {
    let propertyType: 'all' | 'villa' | 'officetel' = 'all'
    if (villaOn && !officetelOn) propertyType = 'villa'
    else if (!villaOn && officetelOn) propertyType = 'officetel'

    setFilters({
      propertyType,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
      minArea: areaRange[0] > 0 ? areaRange[0] : undefined,
      maxArea: areaRange[1] < 200 ? areaRange[1] : undefined,
      minBuildYear: buildYearRange[0] > 1970 ? buildYearRange[0] : undefined,
      maxBuildYear: buildYearRange[1] < new Date().getFullYear() ? buildYearRange[1] : undefined,
    })
  }

  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const handleSeedIncheon = async () => {
    if (isSeeding) return
    setIsSeeding(true)
    setSeedResult('인천 데이터 수집 중... (약 3~5분 소요)')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const res = await axios.post(`${apiUrl}/collector/seed-incheon`, { months: 12 }, { timeout: 600000 })
      const { newRegions, newTransactions } = res.data.data
      setSeedResult(`완료! 동 ${newRegions}개 추가, 거래 ${newTransactions}건 저장`)
    } catch {
      setSeedResult('수집 실패 — 서버 로그를 확인해주세요')
    } finally {
      setIsSeeding(false)
    }
  }

  const formatPriceLabel = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억` : `${v.toLocaleString()}만`
  const formatArea = (v: number) => `${v}㎡`
  const formatYear = (v: number) => `${v}년`

  // 필터가 기본값에서 변경됐는지 여부
  const hasActiveFilters = filters.propertyType !== 'all' ||
    filters.minPrice !== undefined || filters.maxPrice !== undefined ||
    filters.minArea !== undefined || filters.maxArea !== undefined ||
    filters.minBuildYear !== undefined || filters.maxBuildYear !== undefined

  const ChangeTag = ({ pct }: { pct: number }) => {
    if (Math.abs(pct) < 0.1) return <span className="flex items-center gap-0.5 text-slate-500 text-[10px]"><Minus className="w-2.5 h-2.5" />보합</span>
    return pct > 0
      ? <span className="flex items-center gap-0.5 text-red-400 text-[10px]"><TrendingUp className="w-2.5 h-2.5" />{pct.toFixed(1)}%</span>
      : <span className="flex items-center gap-0.5 text-blue-400 text-[10px]"><TrendingDown className="w-2.5 h-2.5" />{Math.abs(pct).toFixed(1)}%</span>
  }

  return (
    <aside className="w-[280px] shrink-0 bg-[#0d1526] flex flex-col h-screen border-r border-slate-700/50">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl tracking-tight">PropScope</span>
          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">BETA</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">부동산 실거래가 시세 분석</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

        {/* 지역 검색 */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">지역 검색</label>
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => handleInputChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                placeholder="동 이름 검색 (예: 역삼동)"
                className="w-full pl-8 pr-8 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {query && (
                <button onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false) }} className="absolute right-2.5">
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {isLoading && <div className="px-4 py-3 text-sm text-slate-400">검색 중...</div>}
                {!isLoading && suggestions.length > 0 && suggestions.map(r => (
                  <button key={r.id} onMouseDown={() => handleSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                    <Search className="w-3 h-3 text-slate-500 shrink-0" />
                    {r.fullName || `${r.sidoName} ${r.sigunguName} ${r.dongName}`}
                  </button>
                ))}
                {!isLoading && query.length === 0 && recentSearches.length > 0 && recentSearches.map(r => (
                  <button key={r.lawdCd} onMouseDown={() => handleSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    {r.fullName || `${r.sidoName} ${r.sigunguName} ${r.dongName}`}
                  </button>
                ))}
                {!isLoading && query.length > 0 && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500">검색 결과가 없습니다.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 조회 기간 */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">조회 기간</label>
          <select
            value={filters.periodMonths}
            onChange={e => setFilters({ periodMonths: +e.target.value })}
            className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            {[1,3,6,12,24,36,60].map(m => (
              <option key={m} value={m}>최근 {m >= 12 ? `${m/12}년` : `${m}개월`}</option>
            ))}
          </select>
        </div>

        {/* 시세 정보 */}
        {stats && (
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">평균 시세 · {stats.period}</p>
            </div>

            {/* 빌라 */}
            {stats.villa.transactionCount > 0 && (
              <div className="px-3 py-3 border-b border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded">빌라 다세대</span>
                  <span className="text-[10px] text-slate-500">{stats.villa.transactionCount}건</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">평균 매매가</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{formatPrice(stats.villa.avgPrice)}</span>
                      <ChangeTag pct={stats.villa.monthOverMonthChange} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">평단가</span>
                    <span className="text-xs text-slate-300">{stats.villa.avgPricePerPyeong.toLocaleString()}만/평</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">최저~최고</span>
                    <span className="text-xs text-slate-400">{formatPrice(stats.villa.minPrice)} ~ {formatPrice(stats.villa.maxPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 오피스텔 */}
            {stats.officetel.transactionCount > 0 && (
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-900/40 px-2 py-0.5 rounded">주거 오피스텔</span>
                  <span className="text-[10px] text-slate-500">{stats.officetel.transactionCount}건</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">평균 매매가</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{formatPrice(stats.officetel.avgPrice)}</span>
                      <ChangeTag pct={stats.officetel.monthOverMonthChange} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">평단가</span>
                    <span className="text-xs text-slate-300">{stats.officetel.avgPricePerPyeong.toLocaleString()}만/평</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">최저~최고</span>
                    <span className="text-xs text-slate-400">{formatPrice(stats.officetel.minPrice)} ~ {formatPrice(stats.officetel.maxPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 필터 토글 */}
        <div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>필터</span>
              {hasActiveFilters && (
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">적용중</span>
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-2 space-y-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">

              {/* 주거 분류 */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">
                  주거 분류 <span className="text-slate-600">(미선택 = 전체)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setVillaOn(v => !v)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      villaOn ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                    빌라 다세대
                  </button>
                  <button onClick={() => setOfficetelOn(v => !v)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      officetelOn ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                    주거 오피스텔
                  </button>
                </div>
              </div>

              {/* 매매가 */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-3 block">매매가 (만원)</label>
                <DualRangeSlider min={0} max={200000} step={1000}
                  value={priceRange} onChange={setPriceRange} format={formatPriceLabel} />
              </div>

              {/* 전용면적 */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-3 block">전용면적 (㎡)</label>
                <DualRangeSlider min={0} max={200} step={5}
                  value={areaRange} onChange={setAreaRange} format={formatArea} />
              </div>

              {/* 준공년도 */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-3 block">준공년도</label>
                <DualRangeSlider min={1970} max={new Date().getFullYear()} step={1}
                  value={buildYearRange} onChange={setBuildYearRange} format={formatYear} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 pb-5 pt-3 space-y-2 border-t border-slate-700/50">
        <button
          onClick={handleSearch}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          지금 시세 조회
        </button>
        <button
          onClick={resetFilters}
          className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          필터 초기화
        </button>

        {/* 인천 데이터 수집 */}
        <div className="pt-2 border-t border-slate-700/50">
          <button
            onClick={handleSeedIncheon}
            disabled={isSeeding}
            className="w-full py-2 text-slate-500 hover:text-slate-300 disabled:opacity-50 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {isSeeding
              ? <><Loader2 className="w-3 h-3 animate-spin" />수집 중...</>
              : <><DatabaseZap className="w-3 h-3" />인천 데이터 수집</>
            }
          </button>
          {seedResult && (
            <p className="text-[10px] text-center text-slate-500 mt-1 px-2">{seedResult}</p>
          )}
        </div>
      </div>
    </aside>
  )
}
