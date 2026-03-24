'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PropertyStats } from '@/types'
import { formatPrice, formatPricePerPyeong } from '@/lib/utils'

interface StatsSummaryCardProps {
  label: string
  stats: PropertyStats | null
  isLoading?: boolean
}

export default function StatsSummaryCard({ label, stats, isLoading }: StatsSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const change = stats.monthOverMonthChange
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const changeColor = change > 0 ? 'text-red-500' : change < 0 ? 'text-blue-500' : 'text-gray-500'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">평균 매매가</p>
          <p className="text-base font-bold text-gray-900">{formatPrice(stats.avgPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">평균 평당가</p>
          <p className="text-base font-bold text-gray-900">{formatPricePerPyeong(stats.avgPricePerPyeong)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">거래 건수</p>
          <p className="text-base font-bold text-gray-900">{stats.transactionCount.toLocaleString()}건</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">전월 대비</p>
          <div className={`flex items-center gap-1 ${changeColor}`}>
            <ChangeIcon className="w-4 h-4" />
            <p className="text-base font-bold">{Math.abs(change).toFixed(1)}%</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
        <span>최고: {formatPrice(stats.maxPrice)}</span>
        <span>최저: {formatPrice(stats.minPrice)}</span>
      </div>
    </div>
  )
}
