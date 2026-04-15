'use client'

import { Transaction } from '@/types'
import { formatPrice, formatPricePerPyeong, formatDate } from '@/lib/utils'
import { X, ChevronUp, ChevronDown, Loader2, DatabaseZap } from 'lucide-react'

interface TransactionTableProps {
  transactions: Transaction[]
  totalCount: number
  isLoading: boolean
  isCollecting: boolean
  collectMsg: string | null
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
  onClose: () => void
  onSort: (col: string) => void
  sortCol: string
  sortOrder: 'asc' | 'desc'
  onRowClick?: (tx: Transaction) => void
}

const COLS = [
  { key: 'buildingName', label: '건물명', width: 'w-36' },
  { key: 'exclusiveArea', label: '면적', width: 'w-24' },
  { key: 'address', label: '매물주소', width: 'w-40' },
  { key: 'price', label: '매매금액', width: 'w-28' },
  { key: 'pricePerPyeong', label: '평단가', width: 'w-24' },
  { key: 'floor', label: '층', width: 'w-12' },
  { key: 'buildYear', label: '준공', width: 'w-14' },
  { key: 'dealDate', label: '계약일', width: 'w-24' },
  { key: 'propertyType', label: '타입', width: 'w-20' },
]

export default function TransactionTable({
  transactions, totalCount, isLoading, isCollecting, collectMsg,
  currentPage, totalPages, onPageChange, onClose, onSort, sortCol, sortOrder, onRowClick,
}: TransactionTableProps) {
  const pageWindow = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    return start + i
  }).filter(p => p >= 1 && p <= totalPages)

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">실거래가 매물 목록</h3>
          <span className="text-xs text-slate-400">총 {totalCount.toLocaleString()}건</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Loading / Collecting */}
      {(isLoading || isCollecting) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border-b border-blue-800/50 shrink-0">
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          <span className="text-xs text-blue-300">{isCollecting ? collectMsg : '데이터 불러오는 중...'}</span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {transactions.length > 0 ? (
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr>
                {COLS.map(col => (
                  <th key={col.key}
                    className={`px-3 py-2 text-slate-400 font-medium whitespace-nowrap cursor-pointer hover:text-slate-200 select-none ${col.width}`}
                    onClick={() => onSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key
                        ? sortOrder === 'asc'
                          ? <ChevronUp className="w-3 h-3 text-blue-400" />
                          : <ChevronDown className="w-3 h-3 text-blue-400" />
                        : <ChevronDown className="w-3 h-3 text-slate-600" />
                      }
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((t, i) => (
                <tr key={t.id}
                  onClick={() => onRowClick?.(t)}
                  className={`hover:bg-blue-900/20 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                  <td className="px-3 py-2 text-slate-200 font-medium truncate max-w-[144px]">{t.buildingName}</td>
                  <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                    {t.exclusiveArea}㎡<span className="text-slate-500 ml-1">({(t.exclusiveArea / 3.3058).toFixed(1)}평)</span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 truncate max-w-[160px]">{t.address}</td>
                  <td className="px-3 py-2 text-white font-semibold whitespace-nowrap">{formatPrice(t.dealAmount)}</td>
                  <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{formatPricePerPyeong(t.pricePerPyeong)}</td>
                  <td className="px-3 py-2 text-slate-300">{t.floor}층</td>
                  <td className="px-3 py-2 text-slate-400">{t.buildYear}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{formatDate(t.dealDate)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                      t.propertyType === 'villa'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                        : 'bg-violet-900/60 text-violet-300 border border-violet-700/50'
                    }`}>
                      {t.propertyType === 'villa' ? '빌라' : '오피스텔'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !isLoading && !isCollecting ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
            <DatabaseZap className="w-8 h-8 text-slate-600" />
            <p className="text-sm">{collectMsg ?? '이 지역의 실거래 데이터가 없습니다.'}</p>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-2 border-t border-slate-700 shrink-0">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">‹</button>
          {pageWindow.map(p => (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                p === currentPage ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">›</button>
        </div>
      )}
    </div>
  )
}
