'use client'

import { X, TrendingUp, TrendingDown, Minus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Region, Transaction, TransactionStats } from '@/types'
import { formatPrice } from '@/lib/utils'

interface SelectedBuilding {
  name: string
  address: string
  transactions: Transaction[]
}

interface LeftPanelProps {
  open: boolean
  region: Region | null
  stats: TransactionStats | null
  selectedBuilding: SelectedBuilding | null
  transactions: Transaction[]
  totalCount: number
  totalPages: number
  currentPage: number
  isLoading: boolean
  collectMsg: string | null
  onPageChange: (p: number) => void
  onClose: () => void
  onSort: (col: string) => void
  sortCol: string
  sortOrder: 'asc' | 'desc'
}

function ChangeTag({ pct }: { pct: number }) {
  if (Math.abs(pct) < 0.1)
    return <span className="flex items-center gap-0.5 text-slate-400 text-[10px]"><Minus className="w-2.5 h-2.5" />보합</span>
  return pct > 0
    ? <span className="flex items-center gap-0.5 text-red-400 text-[10px]"><TrendingUp className="w-2.5 h-2.5" />{pct.toFixed(1)}%</span>
    : <span className="flex items-center gap-0.5 text-blue-400 text-[10px]"><TrendingDown className="w-2.5 h-2.5" />{Math.abs(pct).toFixed(1)}%</span>
}

export default function LeftPanel({
  open,
  region,
  stats,
  selectedBuilding,
  transactions,
  totalCount,
  totalPages,
  currentPage,
  isLoading,
  collectMsg,
  onPageChange,
  onClose,
  onSort,
  sortCol,
  sortOrder,
}: LeftPanelProps) {
  const regionLabel = region
    ? (region.fullName || `${region.sidoName} ${region.sigunguName} ${region.dongName}`)
    : ''

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 z-40 w-[360px] flex flex-col
        transition-transform duration-300 ease-in-out
        bg-[#0d1526]/98 backdrop-blur-md border-r border-slate-700/60
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/60 shrink-0">
        <div>
          <p className="text-white font-bold text-base leading-tight">{regionLabel || 'PropScope'}</p>
          {region && <p className="text-slate-400 text-xs mt-0.5">부동산 실거래가</p>}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 선택된 건물 상세 */}
      {selectedBuilding && (
        <div className="mx-3 mt-3 bg-slate-800/60 border border-slate-600/60 rounded-xl p-3.5 shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{selectedBuilding.name}</p>
              <p className="text-slate-400 text-[11px] mt-0.5 truncate">{selectedBuilding.address}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2 shrink-0 ${
              selectedBuilding.transactions[0]?.propertyType === 'villa'
                ? 'bg-orange-900/60 text-orange-300'
                : 'bg-violet-900/60 text-violet-300'
            }`}>
              {selectedBuilding.transactions[0]?.propertyType === 'villa' ? '빌라' : '오피스텔'}
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mb-2 font-medium">거래내역 {selectedBuilding.transactions.length}건</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {selectedBuilding.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-700/40 last:border-0">
                <span className="text-slate-500 w-20 shrink-0">{tx.dealDate.replace(/-/g, '.')}</span>
                <span className="text-white font-bold">{formatPrice(tx.dealAmount)}</span>
                <span className="text-slate-400">{tx.exclusiveArea}㎡</span>
                <span className="text-slate-500">{tx.floor}층</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시세 정보 */}
      {stats && !selectedBuilding && (
        <div className="mx-3 mt-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {stats.villa.transactionCount > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded">빌라</span>
                  <span className="text-[10px] text-slate-500">{stats.villa.transactionCount}건</span>
                </div>
                <p className="text-white font-bold text-sm">{formatPrice(stats.villa.avgPrice)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-slate-400 text-[11px]">{stats.villa.avgPricePerPyeong.toLocaleString()}만/평</p>
                  <ChangeTag pct={stats.villa.monthOverMonthChange} />
                </div>
              </div>
            )}
            {stats.officetel.transactionCount > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-900/30 px-1.5 py-0.5 rounded">오피스텔</span>
                  <span className="text-[10px] text-slate-500">{stats.officetel.transactionCount}건</span>
                </div>
                <p className="text-white font-bold text-sm">{formatPrice(stats.officetel.avgPrice)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-slate-400 text-[11px]">{stats.officetel.avgPricePerPyeong.toLocaleString()}만/평</p>
                  <ChangeTag pct={stats.officetel.monthOverMonthChange} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 거래 목록 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60 shrink-0 mt-3">
        <span className="text-xs font-semibold text-slate-300">
          실거래가 목록 {totalCount > 0 ? `${totalCount.toLocaleString()}건` : ''}
        </span>
        <div className="flex items-center gap-1">
          {[
            { key: 'dealDate', label: '날짜' },
            { key: 'price', label: '가격' },
            { key: 'pricePerPyeong', label: '평단가' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                sortCol === key
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {label} {sortCol === key ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-xs text-slate-400">{collectMsg || '불러오는 중...'}</span>
          </div>
        )}

        {!isLoading && collectMsg && transactions.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">{collectMsg}</p>
          </div>
        )}

        {!isLoading && transactions.length === 0 && !collectMsg && region && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-slate-500">거래 내역이 없습니다.</p>
          </div>
        )}

        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="px-4 py-3 border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    tx.propertyType === 'villa'
                      ? 'bg-orange-900/50 text-orange-300'
                      : 'bg-violet-900/50 text-violet-300'
                  }`}>
                    {tx.propertyType === 'villa' ? '빌라' : '오피스텔'}
                  </span>
                  <p className="text-slate-200 text-xs font-medium truncate group-hover:text-white transition-colors">
                    {tx.buildingName}
                  </p>
                </div>
                <p className="text-slate-500 text-[10px] truncate">{tx.address}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-bold text-sm">{formatPrice(tx.dealAmount)}</p>
                <p className="text-slate-400 text-[10px]">{tx.pricePerPyeong.toLocaleString()}만/평</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
              <span>{tx.exclusiveArea}㎡ ({(tx.exclusiveArea / 3.3058).toFixed(1)}평)</span>
              <span>·</span>
              <span>{tx.floor}층</span>
              <span>·</span>
              <span>{tx.buildYear}년</span>
              <span>·</span>
              <span>{tx.dealDate.replace(/-/g, '.')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-700/60 shrink-0">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
