import type { Metadata } from 'next'
import Script from 'next/script'
import BackendWarmup from '@/components/BackendWarmup'
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
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
  return (
    <html lang="ko">
      <body>
        {kakaoKey && (
          <Script
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=services`}
            strategy="afterInteractive"
          />
        )}
        <BackendWarmup />
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
