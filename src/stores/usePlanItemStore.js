import { create } from 'zustand'
import * as api from '../api/planItems'

const usePlanItemStore = create((set) => ({
  items: [],
  loading: false,

  fetchItems: async (tripId, category) => {
    set({ loading: true })
    const res = await api.getPlanItems(tripId, category)
    set({ items: res.data.data, loading: false })
  },

  createItem: async (tripId, data) => {
    const res = await api.createPlanItem(tripId, data)
    set((state) => ({ items: [...state.items, res.data.data] }))
    return res.data.data
  },

  updateItem: async (tripId, itemId, data) => {
    const res = await api.updatePlanItem(tripId, itemId, data)
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? res.data.data : i)),
    }))
    return res.data.data
  },

  changeStatus: async (tripId, itemId, status) => {
    const res = await api.changePlanItemStatus(tripId, itemId, status)
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? res.data.data : i)),
    }))
    return res.data.data
  },

  deleteItem: async (tripId, itemId) => {
    await api.deletePlanItem(tripId, itemId)
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }))
  },
}))

export default usePlanItemStore
