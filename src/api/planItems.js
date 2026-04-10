import client from './client'

export const getPlanItems = (tripId, category) =>
  client.get(`/trips/${tripId}/plan-items`, {
    params: category ? { category } : {},
  })

export const createPlanItem = (tripId, data) =>
  client.post(`/trips/${tripId}/plan-items`, data)

export const updatePlanItem = (tripId, itemId, data) =>
  client.patch(`/trips/${tripId}/plan-items/${itemId}`, data)

export const changePlanItemStatus = (tripId, itemId, status) =>
  client.patch(`/trips/${tripId}/plan-items/${itemId}/status`, { status })

export const deletePlanItem = (tripId, itemId) =>
  client.delete(`/trips/${tripId}/plan-items/${itemId}`)

export const reorderPlanItems = (tripId, itemIds) =>
  client.patch(`/trips/${tripId}/plan-items/reorder`, itemIds)

export const getVisitReviews = (planItemId) =>
  client.get(`/plan-items/${planItemId}/reviews`)

export const createVisitReview = (planItemId, data) =>
  client.post(`/plan-items/${planItemId}/reviews`, data)

export const updateVisitReview = (planItemId, reviewId, data) =>
  client.patch(`/plan-items/${planItemId}/reviews/${reviewId}`, data)
