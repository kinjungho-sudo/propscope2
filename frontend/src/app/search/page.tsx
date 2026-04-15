'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SearchSidebar from '@/components/sidebar/SearchSidebar'
import KakaoMap from '@/components/map/KakaoMap'
import TransactionTable from '@/components/transactions/TransactionTable'
import { useSearchStore } from '@/store/search'
import { transactionsApi, collectorApi } from '@/lib/api'
import { Transaction } from '@/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const regionCode = searchParams.get('region')
  const { filters, selectedRegion, setFilters } = useSearchStore()

  const mergedFilters = useMemo(
    () => ({ ...filters, regionId: regionCode || '' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regionCode, filters.propertyType, filters.periodMonths, filters.sort, filters.page, filters.order,
     filters.minPrice, filters.maxPrice, filters.minArea, filters.maxArea, filters.minBuildYear]
  )

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectMsg, setCollectMsg] = useState<string | null>(null)
  const [hasCheckedEmpty, setHasCheckedEmpty] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [sortCol, setSortCol] = useState('dealDate')
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryRef = useRef(false)

  const fetchTransactions = useCallback(async (isRetry = false) => {
    if (!mergedFilters.regionId) return
    setIsLoading(true)
    if (!isRetry) setCollectMsg(null)
    try {
      const res = await transactionsApi.list(mergedFilters)
      const { transactions: txs, pagination } = res.data.data
      setTransactions(txs)
      setTotalCount(pagination.totalCount)
      setTotalPages(pagination.totalPages)
      setShowTable(true)
      setHasCheckedEmpty(true)
      setRetryCount(0)
      setIsRetrying(false)
      retryRef.current = false
    } catch (err: unknown) {
      const isTimeout = (err as { code?: string })?.code === 'ECONNABORTED' ||
        (err as { message?: string })?.message?.includes('timeout')

      if (isTimeout && !retryRef.current) {
        // 콜드 스타트 감지 → 자동 재시도
        retryRef.current = true
        setIsRetrying(true)
        setCollectMsg('서버 시작 중... 잠시 후 자동으로 재시도합니다')
        setTimeout(() => {
          setRetryCount(c => c + 1)
        }, 8000)
      } else {
        setHasCheckedEmpty(true)
        setIsRetrying(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [mergedFilters])

  // retryCount 변경 시 재시도
  useEffect(() => {
    if (retryCount === 0) return
    if (retryCount > 5) {
      setIsRetrying(false)
      setCollectMsg('서버 응답 없음 — 잠시 후 다시 시도해주세요')
      retryRef.current = false
      return
    }
    setCollectMsg(`서버 웨이크업 재시도 중... (${retryCount}/5)`)
    fetchTransactions(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount])

  useEffect(() => {
    setHasCheckedEmpty(false)
    setCollectMsg(null)
    setIsRetrying(false)
    retryRef.current = false
    setRetryCount(0)
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    if (!hasCheckedEmpty || transactions.length > 0 || isCollecting || collectMsg) return
    if (!mergedFilters.regionId) return
    setIsCollecting(true)
    setCollectMsg('국토부 실거래가 데이터 수집 중...')
    collectorApi.collectRecent(mergedFilters.regionId, 6)
      .then(async (res) => {
        const { total } = res.data.data
        if (total === 0) { setCollectMsg('이 지역의 국토부 등록 거래 내역이 없습니다.'); return }
        setCollectMsg(`${total}건 수집 완료!`)
        await fetchTransactions()
      })
      .catch(() => setCollectMsg('데이터 수집 중 오류가 발생했습니다.'))
      .finally(() => setIsCollecting(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedEmpty, transactions.length])

  const handleSort = (col: string) => {
    const sortMap: Record<string, string> = {
      price: 'price', pricePerPyeong: 'pricePerPyeong', exclusiveArea: 'area', dealDate: 'dealDate',
    }
    const apiSort = sortMap[col] || 'dealDate'
    const newOrder = sortCol === col && filters.order === 'desc' ? 'asc' : 'desc'
    setSortCol(col)
    setFilters({ sort: apiSort as 'dealDate' | 'price' | 'pricePerPyeong' | 'area', order: newOrder, page: 1 })
  }

  const loadingMsg = isRetrying ? collectMsg : (isLoading ? '데이터 불러오는 중...' : collectMsg)

  return (
    <div className="flex h-screen bg-[#0d1526] overflow-hidden">
      <SearchSidebar />

      <div className="flex-1 relative">
        <KakaoMap region={selectedRegion} transactions={transactions} hoveredTransactionId={null} />

        {!regionCode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-sm px-6 py-4 rounded-xl border border-slate-700 shadow-xl">
              왼쪽에서 지역을 검색하세요
            </div>
          </div>
        )}

        {/* 콜드 스타트 재시도 배너 */}
        {isRetrying && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-900/90 border border-amber-700 text-amber-200 text-xs px-5 py-3 rounded-xl shadow-2xl backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            {collectMsg}
          </div>
        )}

        {(showTable || isLoading || isRetrying || collectMsg) && regionCode && (
          <TransactionTable
            transactions={transactions}
            totalCount={totalCount}
            isLoading={isLoading || isRetrying}
            isCollecting={isCollecting}
            collectMsg={loadingMsg}
            currentPage={filters.page ?? 1}
            totalPages={totalPages}
            onPageChange={(p) => setFilters({ page: p })}
            onClose={() => setShowTable(false)}
            onSort={handleSort}
            sortCol={sortCol}
            sortOrder={filters.order}
          />
        )}

        {!showTable && !isLoading && !isRetrying && !collectMsg && regionCode && (
          <button
            onClick={() => { setShowTable(true); fetchTransactions() }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-600 text-slate-300 text-xs px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors backdrop-blur-sm"
          >
            실거래가 목록 보기 ({totalCount.toLocaleString()}건) ▲
          </button>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0d1526] text-slate-400 text-sm">
        로딩 중...
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
