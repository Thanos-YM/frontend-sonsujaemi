import { create } from 'zustand'
import * as api from '../api/trips'

const useTripStore = create((set) => ({
  trips: [],
  currentTrip: null,
  logs: [],
  loading: false,

  fetchTrips: async (status) => {
    set({ loading: true })
    try {
      const res = await api.getTrips(status)
      set({ trips: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchTrip: async (tripId) => {
    set({ loading: true })
    try {
      const res = await api.getTrip(tripId)
      set({ currentTrip: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createTrip: async (data) => {
    const res = await api.createTrip(data)
    return res.data.data
  },

  updateTrip: async (tripId, data) => {
    const res = await api.updateTrip(tripId, data)
    set({ currentTrip: res.data.data })
    return res.data.data
  },

  updateGatherInfo: async (tripId, data) => {
    const res = await api.updateGatherInfo(tripId, data)
    set({ currentTrip: res.data.data })
    return res.data.data
  },

  cancelTrip: async (tripId, cancelReason) => {
    const res = await api.cancelTrip(tripId, cancelReason)
    set({ currentTrip: res.data.data })
    return res.data.data
  },

  completeTrip: async (tripId) => {
    const res = await api.completeTrip(tripId)
    set({ currentTrip: res.data.data })
    return res.data.data
  },

  fetchLogs: async (tripId) => {
    try {
      const res = await api.getTripLogs(tripId)
      set({ logs: res.data.data })
    } catch {
      // no-op
    }
  },
}))

export default useTripStore
