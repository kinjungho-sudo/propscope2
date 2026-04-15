'use client'

import { useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { SearchFilters } from '@/types'
import { DualRangeSlider } from '@/components/ui/DualRangeSlider'
import { useSearchStore } from '@/store/search'

interface FilterPanelProps {
  onClose: () => void
  onApply: (filters: Partial<SearchFilters>) => void
}

export default function FilterPanel({ onClose, onApply }: FilterPanelProps) {
  const { filters } = useSearchStore()
  const [villaOn, setVillaOn] = useState(filters.propertyType === 'villa' || filters.propertyType === 'all')
  const [officetelOn, setOfficetelOn] = useState(filters.propertyType === 'officetel' || filters.propertyType === 'all')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 200000,
  ])
  const [areaRange, setAreaRange] = useState<[number, number]>([
    filters.minArea ?? 0,
    filters.maxArea ?? 200,
  ])
  const [buildYearRange, setBuildYearRange] = useState<[number, number]>([
    filters.minBuildYear ?? 1970,
    filters.maxBuildYear ?? new Date().getFullYear(),
  ])

  const formatPriceLabel = (v: number) =>
    v >= 10000 ? `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억` : `${v.toLocaleString()}만`
  const formatArea = (v: number) => `${v}㎡`
  const formatYear = (v: number) => `${v}년`

  const handleApply = () => {
    let propertyType: 'all' | 'villa' | 'officetel' = 'all'
    if (villaOn && !officetelOn) propertyType = 'villa'
    else if (!villaOn && officetelOn) propertyType = 'officetel'

    onApply({
      propertyType,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
      minArea: areaRange[0] > 0 ? areaRange[0] : undefined,
      maxArea: areaRange[1] < 200 ? areaRange[1] : undefined,
      minBuildYear: buildYearRange[0] > 1970 ? buildYearRange[0] : undefined,
      maxBuildYear: buildYearRange[1] < new Date().getFullYear() ? buildYearRange[1] : undefined,
    })
  }

  const handleReset = () => {
    setVillaOn(true)
    setOfficetelOn(true)
    setPriceRange([0, 200000])
    setAreaRange([0, 200])
    setBuildYearRange([1970, new Date().getFullYear()])
  }

  return (
    <div className="absolute top-16 left-3 z-50 bg-[#0d1526]/98 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-700/60 p-5 w-80">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-slate-200">필터</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-5">
        {/* 주거 분류 */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">
            주거 분류
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setVillaOn(v => !v)}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                villaOn
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-500'
              }`}
            >
              빌라 다세대
            </button>
            <button
              onClick={() => setOfficetelOn(v => !v)}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                officetelOn
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-500'
              }`}
            >
              주거 오피스텔
            </button>
          </div>
        </div>

        {/* 매매가 */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            매매가 (만원)
          </label>
          <DualRangeSlider min={0} max={200000} step={1000}
            value={priceRange} onChange={setPriceRange} format={formatPriceLabel} />
        </div>

        {/* 전용면적 */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            전용면적 (㎡)
          </label>
          <DualRangeSlider min={0} max={200} step={5}
            value={areaRange} onChange={setAreaRange} format={formatArea} />
        </div>

        {/* 준공년도 */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            준공년도
          </label>
          <DualRangeSlider min={1970} max={new Date().getFullYear()} step={1}
            value={buildYearRange} onChange={setBuildYearRange} format={formatYear} />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-slate-700/60">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          초기화
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          적용
        </button>
      </div>
    </div>
  )
}
