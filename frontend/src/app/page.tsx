'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SearchSidebar from '@/components/sidebar/SearchSidebar'
import KakaoMap from '@/components/map/KakaoMap'
import TransactionTable from '@/components/transactions/TransactionTable'
import { useSearchStore } from '@/store/search'
import { transactionsApi, collectorApi } from '@/lib/api'
import { Transaction, TransactionStats } from '@/types'
import { formatPrice } from '@/lib/utils'

// ─── Transaction Detail Card (map overlay) ────────────────────────────────────
function TransactionDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="absolute top-3 right-3 z-50 w-64 bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{tx.buildingName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tx.address}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-2 shrink-0 text-lg leading-none">×</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800 rounded-lg p-2.5">
          <p className="text-slate-500 text-[10px]">매매금액</p>
          <p className="text-white font-bold mt-0.5">{formatPrice(tx.dealAmount)}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5">
          <p className="text-slate-500 text-[10px]">평단가</p>
          <p className="text-white font-bold mt-0.5">{tx.pricePerPyeong.toLocaleString()}만/평</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5">
          <p className="text-slate-500 text-[10px]">전용면적</p>
          <p className="text-slate-200 mt-0.5">{tx.exclusiveArea}㎡ ({(tx.exclusiveArea / 3.3058).toFixed(1)}평)</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5">
          <p className="text-slate-500 text-[10px]">층 / 준공</p>
          <p className="text-slate-200 mt-0.5">{tx.floor}층 / {tx.buildYear}년</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5 col-span-2">
          <p className="text-slate-500 text-[10px]">계약일</p>
          <p className="text-slate-200 mt-0.5">{tx.dealDate.replace(/-/g, '.')}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
          tx.propertyType === 'villa' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-violet-900/60 text-violet-300'
        }`}>
          {tx.propertyType === 'villa' ? '빌라 / 다세대' : '주거 오피스텔'}
        </span>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { filters, selectedRegion, setFilters, setPage, searchVersion } = useSearchStore()

  const mergedFilters = useMemo(
    () => ({ ...filters, regionId: selectedRegion?.lawdCd || filters.regionId || '' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchVersion, selectedRegion?.lawdCd]
  )

  const hasRegion = !!mergedFilters.regionId

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectMsg, setCollectMsg] = useState<string | null>(null)
  const [hasCheckedEmpty, setHasCheckedEmpty] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [sortCol, setSortCol] = useState('dealDate')
  const [isRetrying, setIsRetrying] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)

  const retryRef = useRef(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchStats = useCallback(async (regionId: string, propType: string) => {
    if (!regionId) return
    try {
      const res = await transactionsApi.stats(regionId, propType === 'all' ? undefined : propType)
      setStats(res.data.data)
    } catch { /* non-critical */ }
  }, [])

  const fetchTransactions = useCallback(async (isRetry = false): Promise<boolean> => {
    if (!mergedFilters.regionId) return true
    setIsLoading(true)
    if (!isRetry) { setCollectMsg(null); setHasCheckedEmpty(false) }
    try {
      const res = await transactionsApi.list(mergedFilters)
      const { transactions: txs, pagination } = res.data.data
      setTransactions(txs)
      setTotalCount(pagination.totalCount)
      setTotalPages(pagination.totalPages)
      setShowTable(true)
      setHasCheckedEmpty(true)
      setIsRetrying(false)
      retryRef.current = false
      return true
    } catch (err: unknown) {
      const isTimeout =
        (err as { code?: string })?.code === 'ECONNABORTED' ||
        (err as { message?: string })?.message?.includes('timeout')

      if (isTimeout && !retryRef.current) {
        retryRef.current = true
        setIsRetrying(true)
        let attempt = 0
        const retry = async () => {
          attempt++
          if (attempt > 5) {
            setIsRetrying(false)
            setCollectMsg('서버 응답 없음 — 잠시 후 다시 시도해주세요')
            retryRef.current = false
            return
          }
          setCollectMsg(`서버 웨이크업 재시도 중 (${attempt}/5)...`)
          const ok = await fetchTransactions(true)
          if (!ok) retryTimerRef.current = setTimeout(retry, 8000)
        }
        setCollectMsg('서버 시작 중... 자동 재시도')
        retryTimerRef.current = setTimeout(retry, 8000)
      } else {
        setHasCheckedEmpty(true)
        if (!isRetry) setIsRetrying(false)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedFilters])

  useEffect(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryRef.current = false
    setIsRetrying(false)
    setCollectMsg(null)
    setSelectedTx(null)
    setStats(null)
    fetchTransactions()
    fetchStats(mergedFilters.regionId, mergedFilters.propertyType || 'all')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedFilters])

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
        fetchStats(mergedFilters.regionId, mergedFilters.propertyType || 'all')
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
    setFilters({ sort: apiSort as 'dealDate' | 'price' | 'pricePerPyeong' | 'area', order: newOrder })
  }

  const tableVisible = (showTable || isLoading || isRetrying || !!collectMsg) && hasRegion
  const loadingMsg = isRetrying ? collectMsg : (isLoading ? '데이터 불러오는 중...' : collectMsg)

  return (
    <div className="flex h-screen bg-[#0d1526] overflow-hidden">
      <SearchSidebar stats={stats} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* 지도 */}
          <div className={`relative min-h-0 transition-all duration-300 ${tableVisible ? 'flex-[0_0_40%]' : 'flex-1'}`}>
            <KakaoMap
              region={selectedRegion}
              transactions={transactions}
              hoveredTransactionId={null}
              onTransactionClick={setSelectedTx}
            />

            {!hasRegion && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-sm px-6 py-4 rounded-xl border border-slate-700 shadow-xl">
                  왼쪽에서 지역을 검색하세요
                </div>
              </div>
            )}

            {selectedTx && (
              <TransactionDetail tx={selectedTx} onClose={() => setSelectedTx(null)} />
            )}

            {isRetrying && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-900/90 border border-amber-700 text-amber-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm whitespace-nowrap">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                {collectMsg}
              </div>
            )}

            {!showTable && !isLoading && !isRetrying && !collectMsg && hasRegion && (
              <button
                onClick={() => setShowTable(true)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-600 text-slate-300 text-xs px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors backdrop-blur-sm"
              >
                실거래가 목록 보기 ({totalCount.toLocaleString()}건) ▲
              </button>
            )}
          </div>

          {/* 테이블 패널 */}
          {tableVisible && (
            <div className="flex-1 min-h-0 border-t border-slate-700 overflow-hidden">
              <TransactionTable
                transactions={transactions}
                totalCount={totalCount}
                isLoading={isLoading || isRetrying}
                isCollecting={isCollecting}
                collectMsg={loadingMsg}
                currentPage={filters.page ?? 1}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onClose={() => setShowTable(false)}
                onSort={handleSort}
                sortCol={sortCol}
                sortOrder={filters.order}
                onRowClick={(tx) => setSelectedTx(tx)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
