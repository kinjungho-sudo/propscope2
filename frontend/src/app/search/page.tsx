'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useMemo } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import Header from '@/components/layout/Header'
import FilterBar from '@/components/filters/FilterBar'
import TransactionList from '@/components/transactions/TransactionList'
import StatsSummaryCard from '@/components/stats/StatsSummaryCard'
import KakaoMap from '@/components/map/KakaoMap'
import TrendChart from '@/components/charts/TrendChart'
import { useSearchStore } from '@/store/search'
import { transactionsApi } from '@/lib/api'
import { Transaction, PropertyStats } from '@/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const regionCode = searchParams.get('region')
  const { filters, selectedRegion, setFilters } = useSearchStore()

  // 렌더마다 새 객체 생성을 막아 useCallback/useEffect 무한루프 방지
  const mergedFilters = useMemo(
    () => ({ ...filters, regionId: regionCode || '' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regionCode, filters.propertyType, filters.periodMonths, filters.sort, filters.page, filters.order]
  )

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [hoveredTransactionId, setHoveredTransactionId] = useState<string | null>(null)
  const [villaStats, setVillaStats] = useState<PropertyStats | null>(null)
  const [officetelStats, setOfficetelStats] = useState<PropertyStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch stats whenever region changes
  useEffect(() => {
    if (!regionCode) {
      setVillaStats(null)
      setOfficetelStats(null)
      return
    }
    setStatsLoading(true)
    transactionsApi
      .stats(regionCode)
      .then((res) => {
        const { villa, officetel } = res.data.data
        setVillaStats(villa)
        setOfficetelStats(officetel)
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [regionCode])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <FilterBar />

      <div className="flex-1 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto h-full px-4 py-4 flex flex-col gap-4">

          {/* Stats Summary */}
          {regionCode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <StatsSummaryCard label="빌라(다세대)" stats={villaStats} isLoading={statsLoading} />
              <StatsSummaryCard label="주거용 오피스텔" stats={officetelStats} isLoading={statsLoading} />
            </div>
          )}

          {/* Main: List (left) + Map/Chart tabs (right) */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">

            {/* Transaction List */}
            <div className="overflow-hidden flex flex-col">
              <TransactionList
                filters={mergedFilters}
                onHoverTransaction={(t) => setHoveredTransactionId(t?.id ?? null)}
                onTransactionsLoaded={setTransactions}
                onPageChange={(page) => setFilters({ page })}
              />
            </div>

            {/* Right Panel: Map / Trend tabs */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
              <Tabs.Root defaultValue="map" className="flex flex-col h-full">
                <Tabs.List className="flex border-b border-gray-100 px-4 shrink-0">
                  <Tabs.Trigger
                    value="map"
                    className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 transition-colors"
                  >
                    지도
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="trend"
                    className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 transition-colors"
                  >
                    시세 추이
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="map" className="flex-1 min-h-0">
                  <KakaoMap
                    region={selectedRegion}
                    transactions={transactions}
                    hoveredTransactionId={hoveredTransactionId}
                  />
                </Tabs.Content>

                <Tabs.Content value="trend" className="flex-1 min-h-0 p-4 overflow-y-auto">
                  {regionCode ? (
                    <TrendChart
                      regionId={regionCode}
                      propertyType={filters.propertyType !== 'all' ? filters.propertyType : undefined}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      지역을 선택하면 시세 추이를 확인할 수 있습니다.
                    </div>
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
            로딩 중...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </>
  )
}
