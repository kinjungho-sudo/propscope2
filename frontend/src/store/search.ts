import { create } from 'zustand'
import { Region, SearchFilters } from '@/types'

interface SearchState {
  selectedRegion: Region | null
  filters: SearchFilters
  recentSearches: Region[]
  searchVersion: number  // 조회 버튼 클릭 / 필터 변경 시 증가 → 강제 re-fetch 트리거
  setSelectedRegion: (region: Region | null) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  setPage: (page: number) => void  // 페이지만 변경 (version 증가 없음)
  resetFilters: () => void
  addRecentSearch: (region: Region) => void
}

const defaultFilters: SearchFilters = {
  regionId: '',
  propertyType: 'all',
  periodMonths: 12,
  sort: 'dealDate',
  order: 'desc',
  page: 1,
  limit: 20,
}

export const useSearchStore = create<SearchState>((set, get) => ({
  selectedRegion: null,
  filters: defaultFilters,
  recentSearches: [],
  searchVersion: 0,

  setSelectedRegion: (region) => {
    set({
      selectedRegion: region,
      filters: { ...get().filters, regionId: region?.lawdCd || '', page: 1 },
      searchVersion: get().searchVersion + 1,
    })
    if (region) get().addRecentSearch(region)
  },

  // 필터 변경: 항상 page 1로, searchVersion 증가
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
      searchVersion: state.searchVersion + 1,
    })),

  // 페이지만 변경: page 유지, searchVersion 증가 (페이지 이동도 fetch 필요)
  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
      searchVersion: state.searchVersion + 1,
    })),

  resetFilters: () =>
    set((state) => ({
      filters: { ...defaultFilters, regionId: state.filters.regionId },
      searchVersion: state.searchVersion + 1,
    })),

  addRecentSearch: (region) =>
    set((state) => {
      const filtered = state.recentSearches.filter((r) => r.lawdCd !== region.lawdCd)
      const updated = [region, ...filtered].slice(0, 10)
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentSearches', JSON.stringify(updated))
      }
      return { recentSearches: updated }
    }),
}))
