'use client'

import { useState, useEffect, useCallback } from 'react'
import { Transaction, SearchFilters } from '@/types'
import { transactionsApi } from '@/lib/api'
import TransactionCard from './TransactionCard'
import { Loader2, AlertCircle } from 'lucide-react'

interface TransactionListProps {
  filters: SearchFilters
  onHoverTransaction?: (transaction: Transaction | null) => void
}

export default function TransactionList({ filters, onHoverTransaction }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!filters.regionId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await transactionsApi.list(filters)
      setTransactions(res.data.data.transactions)
      setTotalCount(res.data.data.pagination.totalCount)
      setTotalPages(res.data.data.pagination.totalPages)
    } catch {
      setError('거래 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-1 py-2 text-sm text-gray-500 shrink-0">
        총 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>건
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {transactions.map((t) => (
          <TransactionCard key={t.id} transaction={t} onHover={onHoverTransaction} />
        ))}
        {transactions.length === 0 && (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            조건에 맞는 거래 내역이 없습니다.
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-2 shrink-0">
          {/* Pagination buttons would go here */}
        </div>
      )}
    </div>
  )
}
