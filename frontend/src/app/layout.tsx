import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PropScope | 부동산 실거래가 시세 검색',
  description: '빌라(다세대)·주거용 오피스텔 실거래가 확인 및 평당 가격·시세 분석 전문 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
