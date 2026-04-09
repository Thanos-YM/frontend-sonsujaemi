import client from './client'

export const login = (loginId, password) =>
  client.post('/auth/login', { loginId, password })

export const logout = () => client.post('/auth/logout')

export const getMe = () => client.get('/auth/me')
