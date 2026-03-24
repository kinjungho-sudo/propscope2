import { Building2, Search, BarChart3, FileText } from 'lucide-react'
import Header from '@/components/layout/Header'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="text-center max-w-2xl">
          <div className="flex justify-center mb-6">
            <Building2 className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PropScope
          </h1>
          <p className="text-lg text-gray-500 mb-2">
            부동산 실거래가 시세 분석 서비스
          </p>
          <p className="text-sm text-gray-400 mb-10">
            빌라(다세대)·주거용 오피스텔 실거래가 확인 및 평당 가격·시세 분석
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-8">
            {[
              { icon: Search, title: '동 단위 실거래가 검색', desc: '시·군·구·동 단위 자동완성 검색으로 실거래가 즉시 확인' },
              { icon: BarChart3, title: '5년 시세 트렌드 분석', desc: '월별 가격 추이, 거래량, 면적별 분포 등 종합 분석' },
              { icon: FileText, title: '감정 리포트 PDF 생성', desc: '대출 심사용 감정 리포트를 PDF로 즉시 다운로드' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <Icon className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
