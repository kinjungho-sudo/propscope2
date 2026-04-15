'use client'

import React, { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchSidebar from '@/components/sidebar/SearchSidebar'
import KakaoMap from '@/components/map/KakaoMap'
import TransactionTable from '@/components/transactions/TransactionTable'
import { useSearchStore } from '@/store/search'
import { transactionsApi, collectorApi } from '@/lib/api'
import { Transaction, TransactionStats } from '@/types'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'

// ─── Stats Bar ───────────────────────────────────────────────────────────────
function StatsBar({ stats, propertyType }: { stats: TransactionStats | null; propertyType: string }) {
  if (!stats) return null

  const villaData = stats.villa
  const offiData = stats.officetel
  const showVilla = propertyType !== 'officetel' && villaData.transactionCount > 0
  const showOffi = propertyType !== 'villa' && offiData.transactionCount > 0

  const StatItem = ({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) => (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-white mt-0.5">{value}</span>
      {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
    </div>
  )

  const ChangeTag = ({ pct }: { pct: number }) => {
    if (Math.abs(pct) < 0.1) return <span className="flex items-center gap-0.5 text-slate-400 text-[10px]"><Minus className="w-2.5 h-2.5" />보합</span>
    return pct > 0
      ? <span className="flex items-center gap-0.5 text-red-400 text-[10px]"><TrendingUp className="w-2.5 h-2.5" />{pct.toFixed(1)}%</span>
      : <span className="flex items-center gap-0.5 text-blue-400 text-[10px]"><TrendingDown className="w-2.5 h-2.5" />{Math.abs(pct).toFixed(1)}%</span>
  }

  const TypeStats = ({ data, label, color }: { data: TransactionStats['villa']; label: string; color: string }) => (
    <div className={`flex items-center gap-5 px-5 py-3 border-r border-slate-700/60 last:border-r-0`}>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>{label}</span>
      <StatItem label="평균 매매가" value={formatPrice(data.avgPrice)} sub={<><ChangeTag pct={data.monthOverMonthChange} /></>} />
      <StatItem label="평균 평단가" value={`${data.avgPricePerPyeong.toLocaleString()}만/평`} />
      <StatItem label="최저~최고" value={`${formatPrice(data.minPrice)} ~ ${formatPrice(data.maxPrice)}`} />
      <StatItem label="거래 건수" value={`${data.transactionCount.toLocaleString()}건`} sub={stats.period} />
    </div>
  )

  return (
    <div className="shrink-0 flex items-center bg-slate-900/80 border-b border-slate-700/60 overflow-x-auto">
      <div className="flex items-center gap-1.5 px-4 shrink-0">
        <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{stats.regionName}</span>
      </div>
      {showVilla && <TypeStats data={villaData} label="빌라" color="bg-emerald-900/50 text-emerald-300" />}
      {showOffi && <TypeStats data={offiData} label="오피스텔" color="bg-violet-900/50 text-violet-300" />}
    </div>
  )
}

// ─── Transaction Detail Panel ─────────────────────────────────────────────────
function TransactionDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="absolute top-3 right-3 z-50 w-64 bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{tx.buildingName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tx.address}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-2 shrink-0">✕</button>
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
          tx.propertyType === 'villa'
            ? 'bg-emerald-900/60 text-emerald-300'
            : 'bg-violet-900/60 text-violet-300'
        }`}>
          {tx.propertyType === 'villa' ? '빌라 / 다세대' : '주거 오피스텔'}
        </span>
      </div>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams()
  const regionCode = searchParams.get('region')
  const { filters, selectedRegion, setFilters, setPage, searchVersion } = useSearchStore()

  // mergedFilters: searchVersion 포함 → 같은 필터 재조회 시에도 re-fetch
  const mergedFilters = useMemo(
    () => ({ ...filters, regionId: regionCode || '' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regionCode, searchVersion]
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
    } catch { /* stats is non-critical */ }
  }, [])

  const fetchTransactions = useCallback(async (isRetry = false) => {
    if (!mergedFilters.regionId) return
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
    } catch (err: unknown) {
      const isTimeout =
        (err as { code?: string })?.code === 'ECONNABORTED' ||
        (err as { message?: string })?.message?.includes('timeout')

      if (isTimeout && !retryRef.current) {
        retryRef.current = true
        setIsRetrying(true)
        setCollectMsg('서버 시작 중... 자동 재시도')
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
        retryTimerRef.current = setTimeout(retry, 8000)
        return false
      } else {
        setHasCheckedEmpty(true)
        if (!isRetry) setIsRetrying(false)
      }
    } finally {
      setIsLoading(false)
    }
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedFilters])

  useEffect(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryRef.current = false
    setIsRetrying(false)
    setCollectMsg(null)
    setSelectedTx(null)
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

  const tableVisible = (showTable || isLoading || isRetrying || !!collectMsg) && !!regionCode
  const loadingMsg = isRetrying ? collectMsg : (isLoading ? '데이터 불러오는 중...' : collectMsg)

  return (
    <div className="flex h-screen bg-[#0d1526] overflow-hidden">
      <SearchSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats 바 */}
        {regionCode && stats && (
          <StatsBar stats={stats} propertyType={filters.propertyType || 'all'} />
        )}

        {/* 지도 + 테이블 분할 */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden`}>
          {/* 지도 */}
          <div className={`relative min-h-0 transition-all duration-300 ${tableVisible ? 'flex-[0_0_40%]' : 'flex-1'}`}>
            <KakaoMap
              region={selectedRegion}
              transactions={transactions}
              hoveredTransactionId={null}
              onTransactionClick={setSelectedTx}
            />

            {!regionCode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-sm px-6 py-4 rounded-xl border border-slate-700 shadow-xl">
                  왼쪽에서 지역을 검색하세요
                </div>
              </div>
            )}

            {/* 선택된 거래 상세 */}
            {selectedTx && (
              <TransactionDetail tx={selectedTx} onClose={() => setSelectedTx(null)} />
            )}

            {/* 웨이크업 배너 */}
            {isRetrying && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-900/90 border border-amber-700 text-amber-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm whitespace-nowrap">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                {collectMsg}
              </div>
            )}

            {/* 테이블 닫혔을 때 열기 버튼 */}
            {!showTable && !isLoading && !isRetrying && !collectMsg && regionCode && (
              <button
                onClick={() => { setShowTable(true) }}
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
