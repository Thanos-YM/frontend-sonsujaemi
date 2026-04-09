import client from './client'

export const getMonthlyAvailability = (year, month) =>
  client.get('/availability', { params: { year, month } })

export const saveMyAvailability = (year, month, dates) =>
  client.put('/availability', { year, month, dates })
