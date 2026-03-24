export type PropertyType = 'villa' | 'officetel' | 'all'

export interface Region {
  id: string
  sidoCode: string
  sigunguCode: string
  dongCode: string
  sidoName: string
  sigunguName: string
  dongName: string
  lawdCd: string
  lat: number
  lng: number
  fullName: string
}

export interface Transaction {
  id: string
  buildingName: string
  dealDate: string
  dealAmount: number
  exclusiveArea: number
  pricePerPyeong: number
  floor: number
  buildYear: number
  propertyType: PropertyType
  address: string
  lat: number
  lng: number
}

export interface TransactionStats {
  regionName: string
  period: string
  villa: PropertyStats
  officetel: PropertyStats
}

export interface PropertyStats {
  avgPrice: number
  avgPricePerPyeong: number
  maxPrice: number
  minPrice: number
  transactionCount: number
  monthOverMonthChange: number
}

export interface TrendData {
  month: string
  avgPrice: number
  avgPricePerPyeong: number
  transactionCount: number
}

export interface Listing {
  id: string
  source: 'naver' | 'dabang' | 'zigbang'
  buildingName: string
  askingPrice: number
  exclusiveArea: number
  pricePerPyeong: number
  floor: number
  rooms: number
  bathrooms: number
  maintenanceFee: number
  propertyType: PropertyType
  listingUrl: string
  lat: number
  lng: number
}

export interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface SearchFilters {
  regionId: string
  propertyType: PropertyType
  periodMonths: number
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  minBuildYear?: number
  maxBuildYear?: number
  sort: 'dealDate' | 'price' | 'pricePerPyeong' | 'area'
  order: 'desc' | 'asc'
  page: number
  limit: number
}
