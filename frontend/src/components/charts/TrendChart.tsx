'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { TrendData } from '@/types'
import { transactionsApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface TrendChartProps {
  regionId: string
  propertyType?: string
}

function formatYAxis(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(0)}억`
  return `${value.toLocaleString()}만`
}

function formatTooltipValue(value: number) {
  if (value >= 10000) {
    const uk = Math.floor(value / 10000)
    const rem = value % 10000
    return rem === 0 ? `${uk}억` : `${uk}억 ${rem.toLocaleString()}만`
  }
  return `${value.toLocaleString()}만원`
}

export default function TrendChart({ regionId, propertyType }: TrendChartProps) {
  const [data, setData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!regionId) return
    setIsLoading(true)
    setError(false)
    transactionsApi
      .trend(regionId, 24, propertyType)
      .then((res) => setData(res.data.data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [regionId, propertyType])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        {error ? '데이터를 불러올 수 없습니다.' : '시세 데이터가 없습니다.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 평균 매매가 추이 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          평균 매매가 추이 (24개월)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatTooltipValue(Number(value)), '평균 매매가']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              name="평균 매매가"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 평당가 추이 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          평균 평당가 추이
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${Number(value).toLocaleString()}만/평`, '평균 평당가']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="avgPricePerPyeong"
              name="평균 평당가"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 건수 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          월별 거래 건수
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${Number(value)}건`, '거래 건수']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="transactionCount"
              name="거래 건수"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
