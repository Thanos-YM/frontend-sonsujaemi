import client from './client'

export const createTrip = (data) => client.post('/trips', data)

export const getTrips = (status) =>
  client.get('/trips', { params: status ? { status } : {} })

export const getTrip = (tripId) => client.get(`/trips/${tripId}`)

export const updateTrip = (tripId, data) =>
  client.patch(`/trips/${tripId}`, data)

export const updateGatherInfo = (tripId, data) =>
  client.patch(`/trips/${tripId}/gather`, data)

export const cancelTrip = (tripId, cancelReason) =>
  client.post(`/trips/${tripId}/cancel`, { cancelReason })

export const completeTrip = (tripId) =>
  client.post(`/trips/${tripId}/complete`)

export const getTripLogs = (tripId) =>
  client.get(`/trips/${tripId}/logs`)

export const getTripReviews = (tripId) =>
  client.get(`/trips/${tripId}/reviews`)

export const createTripReview = (tripId, data) =>
  client.post(`/trips/${tripId}/reviews`, data)

export const updateTripReview = (tripId, reviewId, data) =>
  client.patch(`/trips/${tripId}/reviews/${reviewId}`, data)
