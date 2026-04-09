import { create } from 'zustand'
import * as authApi from '../api/auth'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const res = await authApi.getMe()
      set({ user: res.data.data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (loginId, password) => {
    const res = await authApi.login(loginId, password)
    set({ user: res.data.data })
    return res.data.data
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null })
  },
}))

export default useAuthStore
