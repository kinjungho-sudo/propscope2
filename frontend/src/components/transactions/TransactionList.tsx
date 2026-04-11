'use client'

import { useState, useEffect, useCallback } from 'react'
import { Transaction, SearchFilters } from '@/types'
import { transactionsApi, collectorApi } from '@/lib/api'
import TransactionCard from './TransactionCard'
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, DatabaseZap } from 'lucide-react'

interface TransactionListProps {
  filters: SearchFilters
  onHoverTransaction?: (transaction: Transaction | null) => void
  onTransactionsLoaded?: (transactions: Transaction[]) => void
  onPageChange?: (page: number) => void
}

export default function TransactionList({
  filters,
  onHoverTransaction,
  onTransactionsLoaded,
  onPageChange,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectMsg, setCollectMsg] = useState<string | null>(null)
  const [hasCheckedEmpty, setHasCheckedEmpty] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!filters.regionId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await transactionsApi.list(filters)
      const { transactions: txs, pagination } = res.data.data
      setTransactions(txs)
      setTotalCount(pagination.totalCount)
      setTotalPages(pagination.totalPages)
      onTransactionsLoaded?.(txs)
      setHasCheckedEmpty(true)
    } catch {
      setError('거래 데이터를 불러오는데 실패했습니다.')
      setHasCheckedEmpty(true)
    } finally {
      setIsLoading(false)
    }
  // 개별 값으로 비교해야 렌더마다 새 filters 객체로 인한 무한루프 방지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.regionId, filters.propertyType, filters.periodMonths, filters.sort, filters.order, filters.page])

  useEffect(() => {
    setHasCheckedEmpty(false)
    setCollectMsg(null)
    fetchTransactions()
  }, [fetchTransactions])

  // 빈 데이터 확인 즉시 자동 수집
  useEffect(() => {
    if (!hasCheckedEmpty || transactions.length > 0 || isCollecting || collectMsg) return
    if (!filters.regionId) return

    setIsCollecting(true)
    setCollectMsg('국토부 실거래가 데이터 수집 중...')

    collectorApi.collectRecent(filters.regionId, 6)
      .then(async (res) => {
        const { total } = res.data.data
        if (total === 0) {
          setCollectMsg('이 지역의 국토부 등록 거래 내역이 없습니다.')
          return
        }
        setCollectMsg(`${total}건 수집 완료! 목록을 갱신합니다...`)
        await fetchTransactions()
      })
      .catch(() => {
        setCollectMsg('데이터 수집 중 오류가 발생했습니다.')
      })
      .finally(() => setIsCollecting(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedEmpty, transactions.length])

  if (!filters.regionId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-sm">검색할 지역을 선택해주세요.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const currentPage = filters.page ?? 1

  // Page numbers to show (current ± 2, clamped)
  const pageWindow = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    return start + i
  })

  return (
    <div className="flex flex-col h-full">
      <div className="px-1 py-2 text-sm text-gray-500 shrink-0">
        총 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>건
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {transactions.map((t) => (
          <TransactionCard key={t.id} transaction={t} onHover={onHoverTransaction} />
        ))}
        {transactions.length === 0 && hasCheckedEmpty && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-3">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              {isCollecting
                ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                : <DatabaseZap className="w-8 h-8 text-gray-300" />
              }
              <p className="text-gray-500">
                {collectMsg ?? '이 지역의 실거래 데이터가 없습니다.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 shrink-0">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageWindow.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange?.(p)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                p === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
