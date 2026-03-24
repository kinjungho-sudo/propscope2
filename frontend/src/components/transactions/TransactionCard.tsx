import { Transaction } from '@/types'
import { formatPrice, formatPricePerPyeong, formatArea, formatDate } from '@/lib/utils'
import { Building, Calendar, Layers, CalendarDays } from 'lucide-react'

interface TransactionCardProps {
  transaction: Transaction
  onHover?: (transaction: Transaction | null) => void
}

export default function TransactionCard({ transaction, onHover }: TransactionCardProps) {
  const typeLabel = transaction.propertyType === 'villa' ? '빌라' : '오피스텔'
  const typeBadgeColor = transaction.propertyType === 'villa'
    ? 'bg-green-100 text-green-700'
    : 'bg-purple-100 text-purple-700'

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onMouseEnter={() => onHover?.(transaction)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{transaction.buildingName}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{transaction.address}</p>
        </div>
        <span className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor}`}>
          {typeLabel}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-bold text-gray-900">{formatPrice(transaction.dealAmount)}</span>
        <span className="text-sm text-gray-500">{formatPricePerPyeong(transaction.pricePerPyeong)}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Building className="w-3 h-3" />
          <span>{formatArea(transaction.exclusiveArea)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <span>{transaction.floor}층</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3" />
          <span>{transaction.buildYear}년 준공</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(transaction.dealDate)}</span>
        </div>
      </div>
    </div>
  )
}
