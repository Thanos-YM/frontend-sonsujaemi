import { create } from 'zustand'
import * as api from '../api/availability'

const useAvailabilityStore = create((set) => ({
  data: null,
  loading: false,

  fetch: async (year, month) => {
    set({ loading: true })
    try {
      const res = await api.getMonthlyAvailability(year, month)
      set({ data: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  save: async (year, month, dates) => {
    set({ loading: true })
    const res = await api.saveMyAvailability(year, month, dates)
    set({ data: res.data.data, loading: false })
    return res.data.data
  },
}))

export default useAvailabilityStore
