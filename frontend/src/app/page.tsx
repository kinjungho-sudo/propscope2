'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import KakaoMap from '@/components/map/KakaoMap'
import TopBar from '@/components/layout/TopBar'
import FilterPanel from '@/components/layout/FilterPanel'
import LeftPanel from '@/components/layout/LeftPanel'
import { useSearchStore } from '@/store/search'
import { transactionsApi, collectorApi } from '@/lib/api'
import { Transaction, TransactionStats, SearchFilters } from '@/types'

export default function HomePage() {
  const { filters, selectedRegion, setFilters, setPage, setSelectedRegion, recentSearches, searchVersion } = useSearchStore()

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
  const [sortCol, setSortCol] = useState('dealDate')
  const [isRetrying, setIsRetrying] = useState(false)
  const [stats, setStats] = useState<TransactionStats | null>(null)

  // Layout state
  const [filterOpen, setFilterOpen] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<{
    name: string
    address: string
    transactions: Transaction[]
  } | null>(null)

  const retryRef = useRef(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const hasActiveFilters =
    filters.propertyType !== 'all' ||
    filters.minPrice !== undefined || filters.maxPrice !== undefined ||
    filters.minArea !== undefined || filters.maxArea !== undefined ||
    filters.minBuildYear !== undefined || filters.maxBuildYear !== undefined

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
    setStats(null)
    setSelectedBuilding(null)
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

  const loadingMsg = isRetrying ? collectMsg : (isLoading ? '데이터 불러오는 중...' : collectMsg)

  return (
    <div className="relative h-screen overflow-hidden">
      {/* 풀스크린 지도 */}
      <KakaoMap
        region={selectedRegion}
        transactions={transactions}
        hoveredTransactionId={null}
        onBubbleClick={(txs) => {
          setSelectedBuilding({
            name: txs[0].buildingName,
            address: txs[0].address,
            transactions: txs,
          })
          setLeftPanelOpen(true)
        }}
      />

      {/* 상단 플로팅 바 */}
      <TopBar
        onRegionSelect={(region) => {
          setSelectedRegion(region)
          setLeftPanelOpen(true)
          setSelectedBuilding(null)
        }}
        onFilterToggle={() => setFilterOpen(f => !f)}
        filterActive={hasActiveFilters}
        recentSearches={recentSearches}
      />

      {/* 필터 패널 */}
      {filterOpen && (
        <FilterPanel
          onClose={() => setFilterOpen(false)}
          onApply={(f: Partial<SearchFilters>) => {
            setFilters(f)
            setFilterOpen(false)
          }}
        />
      )}

      {/* 좌측 드로어 패널 */}
      <LeftPanel
        open={leftPanelOpen}
        region={selectedRegion}
        stats={stats}
        selectedBuilding={selectedBuilding}
        transactions={transactions}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={filters.page ?? 1}
        isLoading={isLoading || isRetrying}
        collectMsg={loadingMsg}
        onPageChange={(p) => setPage(p)}
        onClose={() => {
          setLeftPanelOpen(false)
          setSelectedBuilding(null)
        }}
        onSort={handleSort}
        sortCol={sortCol}
        sortOrder={filters.order}
      />

      {/* 서버 재시도 토스트 */}
      {isRetrying && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-900/90 border border-amber-700 text-amber-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm whitespace-nowrap">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
          {collectMsg}
        </div>
      )}

      {/* 지역 미선택 안내 */}
      {!hasRegion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-[#0d1526]/90 backdrop-blur-sm text-slate-400 text-sm px-8 py-5 rounded-2xl shadow-xl border border-slate-700/60">
            <p className="font-bold text-base mb-1 text-slate-200">PropScope</p>
            <p>상단 검색창에서 지역을 검색하세요</p>
          </div>
        </div>
      )}
    </div>
  )
}
