'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import FilterBar from '@/components/filters/FilterBar'
import TransactionList from '@/components/transactions/TransactionList'
import StatsSummaryCard from '@/components/stats/StatsSummaryCard'
import { useSearchStore } from '@/store/search'

function SearchContent() {
  const searchParams = useSearchParams()
  const regionCode = searchParams.get('region')
  const { filters } = useSearchStore()

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <FilterBar />
      <div className="flex-1 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto h-full px-4 py-4 flex flex-col gap-4">
          {/* Stats Summary */}
          {regionCode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <StatsSummaryCard label="빌라(다세대)" stats={null} isLoading={false} />
              <StatsSummaryCard label="주거용 오피스텔" stats={null} isLoading={false} />
            </div>
          )}

          {/* Main Content: List + Map */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            <div className="overflow-hidden flex flex-col">
              <TransactionList
                filters={{ ...filters, regionId: regionCode || '' }}
                onHoverTransaction={() => {}}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Kakao Map will be integrated here */}
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                카카오맵 연동 예정
              </div>
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
      <Suspense fallback={<div className="flex items-center justify-center h-screen">로딩 중...</div>}>
        <SearchContent />
      </Suspense>
    </>
  )
}
