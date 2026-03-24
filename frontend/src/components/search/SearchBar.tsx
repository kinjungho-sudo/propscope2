'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Region } from '@/types'
import { useSearchStore } from '@/store/search'

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Region[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setSelectedRegion, recentSearches } = useSearchStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // recentSearches initialized from localStorage via zustand persist
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 1) {
      setSuggestions([])
      setIsOpen(value.length === 0)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await regionsApi.search(value)
        setSuggestions(res.data.data || [])
        setIsOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  const handleSelect = (region: Region) => {
    setQuery(region.fullName || `${region.sidoName} ${region.sigunguName} ${region.dongName}`)
    setSelectedRegion(region)
    setIsOpen(false)
    router.push(`/search?region=${region.lawdCd}`)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="동 이름을 검색하세요 (예: 역삼동, 서초동)"
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">검색 중...</div>
          )}
          {!isLoading && suggestions.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs text-gray-400 font-medium border-b">검색 결과</div>
              {suggestions.map((region) => (
                <button
                  key={region.id}
                  onMouseDown={() => handleSelect(region)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                >
                  <Search className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{region.fullName || `${region.sidoName} ${region.sigunguName} ${region.dongName}`}</span>
                </button>
              ))}
            </>
          )}
          {!isLoading && query.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs text-gray-400 font-medium border-b">최근 검색</div>
              {recentSearches.map((region) => (
                <button
                  key={region.lawdCd}
                  onMouseDown={() => handleSelect(region)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{region.fullName || `${region.sidoName} ${region.sigunguName} ${region.dongName}`}</span>
                </button>
              ))}
            </>
          )}
          {!isLoading && query.length > 0 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  )
}
