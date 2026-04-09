import { create } from 'zustand'
import * as api from '../api/archive'

const useArchiveStore = create((set) => ({
  places: [],
  placeDetail: null,
  tripRecords: [],
  tripRecordDetail: null,
  loading: false,

  fetchPlaces: async (category, sort) => {
    set({ loading: true })
    try {
      const res = await api.getPlaceSummaries(category, sort)
      set({ places: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchPlaceDetail: async (placeId) => {
    set({ loading: true })
    try {
      const res = await api.getPlaceDetail(placeId)
      set({ placeDetail: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchTripRecords: async () => {
    set({ loading: true })
    try {
      const res = await api.getTripRecords()
      set({ tripRecords: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchTripRecordDetail: async (tripId) => {
    set({ loading: true })
    try {
      const res = await api.getTripRecordDetail(tripId)
      set({ tripRecordDetail: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))

export default useArchiveStore
