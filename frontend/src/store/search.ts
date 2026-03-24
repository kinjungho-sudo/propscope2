import { create } from 'zustand'
import { Region, SearchFilters } from '@/types'

interface SearchState {
  selectedRegion: Region | null
  filters: SearchFilters
  recentSearches: Region[]
  setSelectedRegion: (region: Region | null) => void
  setFilters: (filters: Partial<SearchFilters>) => void
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

  setSelectedRegion: (region) => {
    set({
      selectedRegion: region,
      filters: { ...get().filters, regionId: region?.lawdCd || '', page: 1 },
    })
    if (region) get().addRecentSearch(region)
  },

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })),

  resetFilters: () =>
    set((state) => ({
      filters: { ...defaultFilters, regionId: state.filters.regionId },
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
