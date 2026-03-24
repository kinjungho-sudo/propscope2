'use client'

import { PropertyType, SearchFilters } from '@/types'
import { useSearchStore } from '@/store/search'
import { RotateCcw } from 'lucide-react'

const PROPERTY_TYPE_TABS = [
  { value: 'all', label: '전체' },
  { value: 'villa', label: '빌라(다세대)' },
  { value: 'officetel', label: '주거용 오피스텔' },
] as const

const PERIOD_OPTIONS = [
  { value: 1, label: '최근 1개월' },
  { value: 3, label: '최근 3개월' },
  { value: 6, label: '최근 6개월' },
  { value: 12, label: '최근 1년' },
  { value: 24, label: '최근 2년' },
  { value: 36, label: '최근 3년' },
  { value: 60, label: '최근 5년' },
]

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useSearchStore()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 space-y-2">
      {/* Property Type Tabs */}
      <div className="flex gap-1">
        {PROPERTY_TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilters({ propertyType: tab.value as PropertyType })}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              filters.propertyType === tab.value
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filters.periodMonths}
          onChange={(e) => setFilters({ periodMonths: Number(e.target.value) })}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as SearchFilters['sort'] })}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="dealDate">최신 거래순</option>
          <option value="price">매매가순</option>
          <option value="pricePerPyeong">평당가순</option>
          <option value="area">면적순</option>
        </select>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      </div>
    </div>
  )
}
