import client from './client'

export const getPlaceSummaries = (category, sort) =>
  client.get('/archive/places', { params: { category, sort } })

export const getPlaceDetail = (placeId) =>
  client.get(`/archive/places/${placeId}`)

export const getTripRecords = () => client.get('/archive/trips')

export const getTripRecordDetail = (tripId) =>
  client.get(`/archive/trips/${tripId}`)
