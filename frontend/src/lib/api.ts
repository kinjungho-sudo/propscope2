import axios from 'axios'
import { ApiResponse, Region, Transaction, TransactionStats, TrendData, Listing, Pagination, SearchFilters } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const regionsApi = {
  search: (q: string) =>
    api.get<ApiResponse<Region[]>>(`/regions/search`, { params: { q } }),
  getById: (regionId: string) =>
    api.get<ApiResponse<Region>>(`/regions/${regionId}`),
}

export const transactionsApi = {
  list: (filters: Partial<SearchFilters>) =>
    api.get<ApiResponse<{ transactions: Transaction[]; pagination: Pagination }>>(`/transactions`, { params: filters }),
  stats: (regionId: string, propertyType?: string) =>
    api.get<ApiResponse<TransactionStats>>(`/transactions/stats`, { params: { regionId, propertyType } }),
  trend: (regionId: string, months: number, propertyType?: string) =>
    api.get<ApiResponse<TrendData[]>>(`/transactions/trend`, { params: { regionId, months, propertyType } }),
  analysis: (regionId: string, propertyType?: string) =>
    api.get<ApiResponse<Record<string, unknown>>>(`/transactions/analysis`, { params: { regionId, propertyType } }),
}

export const listingsApi = {
  list: (regionId: string, propertyType?: string) =>
    api.get<ApiResponse<{ listings: Listing[] }>>(`/listings`, { params: { regionId, propertyType } }),
}

export const reportsApi = {
  create: (data: { regionId: string; buildingName?: string; transactionIds: string[] }) =>
    api.post<ApiResponse<{ reportId: string }>>(`/reports`, data),
  getById: (reportId: string) =>
    api.get(`/reports/${reportId}`, { responseType: 'blob' }),
  list: () =>
    api.get<ApiResponse<Record<string, unknown>[]>>(`/reports`),
}
