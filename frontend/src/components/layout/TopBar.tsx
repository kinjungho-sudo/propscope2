'use client'

import { useState, useRef } from 'react'
import { Search, SlidersHorizontal, X, Clock } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Region } from '@/types'
import { useSearchStore } from '@/store/search'

interface TopBarProps {
  onRegionSelect: (region: Region) => void
  onFilterToggle: () => void
  filterActive: boolean
  recentSearches: Region[]
}

export default function TopBar({ onRegionSelect, onFilterToggle, filterActive, recentSearches }: TopBarProps) {
  const { filters, setFilters } = useSearchStore()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Region[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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
    onRegionSelect(region)
    setIsOpen(false)
    setSuggestions([])
  }

  const clearQuery = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
  }

  return (
    <div className="absolute top-3 left-3 right-3 z-50 flex items-center gap-2 pointer-events-none">
      {/* 검색창 */}
      <div className="relative flex-1 max-w-md pointer-events-auto">
        <div className="relative flex items-center bg-[#0d1526]/95 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700/60">
          <Search className="absolute left-3 w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            placeholder="동 이름 검색 (예: 역삼동, 서교동)"
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none rounded-xl"
          />
          {query && (
            <button onClick={clearQuery} className="absolute right-2.5">
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#0d1526] border border-slate-700/60 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
            {isLoading && <div className="px-4 py-3 text-sm text-slate-500">검색 중...</div>}
            {!isLoading && suggestions.length > 0 && suggestions.map(r => (
              <button key={r.id} onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl">
                <Search className="w-3 h-3 text-slate-500 shrink-0" />
                {r.fullName || `${r.sidoName} ${r.sigunguName} ${r.dongName}`}
              </button>
            ))}
            {!isLoading && query.length === 0 && recentSearches.length > 0 && (
              <>
                <div className="px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-700/60">최근 검색</div>
                {recentSearches.map(r => (
                  <button key={r.lawdCd} onMouseDown={() => handleSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 flex items-center gap-2 last:rounded-b-xl">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    {r.fullName || `${r.sidoName} ${r.sigunguName} ${r.dongName}`}
                  </button>
                ))}
              </>
            )}
            {!isLoading && query.length > 0 && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">검색 결과가 없습니다.</div>
            )}
          </div>
        )}
      </div>

      {/* 필터 버튼 */}
      <button
        onClick={onFilterToggle}
        className={`pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl backdrop-blur-sm border transition-all ${
          filterActive
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-[#0d1526]/95 border-slate-700/60 text-slate-300 hover:bg-slate-800/90'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        필터
        {filterActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
        )}
      </button>

      {/* 조회 기간 */}
      <select
        value={filters.periodMonths}
        onChange={e => setFilters({ periodMonths: +e.target.value })}
        className="pointer-events-auto px-3 py-2.5 rounded-xl text-sm font-medium bg-[#0d1526]/95 backdrop-blur-sm border border-slate-700/60 text-slate-300 shadow-xl focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800/90"
      >
        {[1, 3, 6, 12, 24, 36, 60].map(m => (
          <option key={m} value={m}>최근 {m >= 12 ? `${m / 12}년` : `${m}개월`}</option>
        ))}
      </select>
    </div>
  )
}
