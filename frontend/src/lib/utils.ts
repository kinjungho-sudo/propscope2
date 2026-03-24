import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  if (amount >= 10000) {
    const uk = Math.floor(amount / 10000)
    const remaining = amount % 10000
    if (remaining === 0) return `${uk}억`
    return `${uk}억 ${remaining.toLocaleString()}만`
  }
  return `${amount.toLocaleString()}만`
}

export function formatPricePerPyeong(price: number): string {
  return `${price.toLocaleString()}만/평`
}

export function calcPricePerPyeong(dealAmount: number, exclusiveArea: number): number {
  return Math.round(dealAmount / (exclusiveArea / 3.3058))
}

export function formatArea(area: number): string {
  const pyeong = (area / 3.3058).toFixed(1)
  return `${area}㎡ (${pyeong}평)`
}

export function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}
