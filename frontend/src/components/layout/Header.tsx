'use client'

import { Building2 } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Building2 className="w-7 h-7 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">PropScope</span>
          <span className="text-xs text-gray-400 hidden sm:block">부동산 실거래가 시세검색</span>
        </div>
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600 shrink-0">
          <a href="/reports" className="hover:text-blue-600 transition-colors">리포트</a>
          <a href="/settings" className="hover:text-blue-600 transition-colors">설정</a>
        </nav>
      </div>
    </header>
  )
}
