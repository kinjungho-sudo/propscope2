'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Star, RotateCcw, X, Clock, FileText } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Region } from '@/types'
import { useSearchStore } from '@/store/search'

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
        {/* track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-slate-600 rounded" />
        {/* active track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={lo}
          onChange={e => { const v = +e.target.value; if (v <= hi) onChange([v, hi]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ zIndex: lo > max - (max - min) * 0.1 ? 5 : 3 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={hi}
          onChange={e => { const v = +e.target.value; if (v >= lo) onChange([lo, v]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        {/* thumbs */}
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctLo}% - 7px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctHi}% - 7px)` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
    </div>
  )
}

export default function SearchSidebar() {
  const router = useRouter()
  const { filters, setFilters, resetFilters, setSelectedRegion, recentSearches } = useSearchStore()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Region[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0, filters.maxPrice ?? 200000,
  ])
  const [areaRange, setAreaRange] = useState<[number, number]>([
    filters.minArea ?? 0, filters.maxArea ?? 200,
  ])
  const [buildYearRange, setBuildYearRange] = useState<[number, number]>([
    filters.minBuildYear ?? 1970, filters.maxBuildYear ?? new Date().getFullYear(),
  ])

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
    router.push(`/search?region=${region.lawdCd}`)
  }

  const handleSearch = () => {
    setFilters({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
      minArea: areaRange[0] > 0 ? areaRange[0] : undefined,
      maxArea: areaRange[1] < 200 ? areaRange[1] : undefined,
      minBuildYear: buildYearRange[0] > 1970 ? buildYearRange[0] : undefined,
      maxBuildYear: buildYearRange[1] < new Date().getFullYear() ? buildYearRange[1] : undefined,
      page: 1,
    })
  }

  const formatPrice = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억` : `${v.toLocaleString()}만`
  const formatArea = (v: number) => `${v}㎡`
  const formatYear = (v: number) => `${v}년`

  return (
    <aside className="w-[280px] shrink-0 bg-[#0d1526] flex flex-col h-screen overflow-y-auto border-r border-slate-700/50">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl tracking-tight">PropScope</span>
          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">BETA</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">부동산 실거래가 시세 분석</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* Search */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">지역 검색</label>
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => handleInputChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                placeholder="동 이름 검색 (예: 역삼동)"
                className="w-full pl-8 pr-8 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {query
                ? <button onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false) }} className="absolute right-2.5"><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" /></button>
                : <Star className="absolute right-2.5 w-3.5 h-3.5 text-slate-500" />
              }
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

        {/* Property Type */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">주거 분류</label>
          <div className="grid grid-cols-2 gap-2">
            {(['villa', 'officetel'] as const).map(type => (
              <button key={type}
                onClick={() => setFilters({ propertyType: filters.propertyType === type ? 'all' : type })}
                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                  filters.propertyType === type
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}>
                {type === 'villa' ? '빌라 다세대' : '주거 오피스텔'}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 block">매매가 (만원)</label>
          <DualRangeSlider
            min={0} max={200000} step={1000}
            value={priceRange} onChange={setPriceRange} format={formatPrice}
          />
        </div>

        {/* Area Range */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 block">전용면적 (㎡)</label>
          <DualRangeSlider
            min={0} max={200} step={5}
            value={areaRange} onChange={setAreaRange} format={formatArea}
          />
        </div>

        {/* Build Year */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 block">준공년도</label>
          <DualRangeSlider
            min={1970} max={new Date().getFullYear()} step={1}
            value={buildYearRange} onChange={setBuildYearRange} format={formatYear}
          />
        </div>

        {/* Period */}
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
      </div>

      {/* Actions */}
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
        <button className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors">
          <FileText className="w-3 h-3" />
          감정 리포트 PDF 저장
        </button>
      </div>
    </aside>
  )
}
