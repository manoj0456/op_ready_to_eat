import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { PaginatedResponse, Restaurant, RestaurantSettings } from '@/types'

export interface RestaurantListParams {
  page?: number
  pageSize?: number
  search?: string
  cuisine?: string
}

export const restaurantApi = {
  list: (params?: RestaurantListParams) =>
    apiClient
      .get<PaginatedResponse<Restaurant>>(API_ENDPOINTS.RESTAURANTS.BASE, { params })
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<Restaurant>(API_ENDPOINTS.RESTAURANTS.BY_ID(id)).then((res) => res.data),

  create: (payload: Partial<Restaurant>) =>
    apiClient.post<Restaurant>(API_ENDPOINTS.RESTAURANTS.BASE, payload).then((res) => res.data),

  update: (id: string, payload: Partial<Restaurant>) =>
    apiClient.patch<Restaurant>(API_ENDPOINTS.RESTAURANTS.BY_ID(id), payload).then((res) => res.data),

  getSettings: (id: string) =>
    apiClient
      .get<RestaurantSettings>(API_ENDPOINTS.RESTAURANTS.SETTINGS(id))
      .then((res) => res.data),

  updateSettings: (id: string, payload: Partial<RestaurantSettings>) =>
    apiClient
      .patch<RestaurantSettings>(API_ENDPOINTS.RESTAURANTS.SETTINGS(id), payload)
      .then((res) => res.data),

  getAnalytics: (id: string, params?: { from?: string; to?: string }) =>
    apiClient
      .get<Record<string, unknown>>(API_ENDPOINTS.RESTAURANTS.ANALYTICS(id), { params })
      .then((res) => res.data),
}
