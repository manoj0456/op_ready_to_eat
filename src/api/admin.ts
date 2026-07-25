import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { PaginatedResponse, Restaurant, User } from '@/types'

export interface AdminListParams {
  page?: number
  pageSize?: number
  search?: string
}

export const adminApi = {
  listUsers: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<User>>(API_ENDPOINTS.ADMIN.USERS, { params })
      .then((res) => res.data),

  updateUser: (id: string, payload: Partial<User>) =>
    apiClient.patch<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, payload).then((res) => res.data),

  deleteUser: (id: string) =>
    apiClient.delete<void>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`).then((res) => res.data),

  listRestaurants: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<Restaurant>>(API_ENDPOINTS.ADMIN.RESTAURANTS, { params })
      .then((res) => res.data),

  approveRestaurant: (id: string) =>
    apiClient
      .patch<Restaurant>(`${API_ENDPOINTS.ADMIN.RESTAURANTS}/${id}`, { isOpen: true })
      .then((res) => res.data),

  getReports: (params?: { from?: string; to?: string }) =>
    apiClient
      .get<Record<string, unknown>>(API_ENDPOINTS.ADMIN.REPORTS, { params })
      .then((res) => res.data),

  getSettings: () =>
    apiClient.get<Record<string, unknown>>(API_ENDPOINTS.ADMIN.SETTINGS).then((res) => res.data),

  updateSettings: (payload: Record<string, unknown>) =>
    apiClient
      .patch<Record<string, unknown>>(API_ENDPOINTS.ADMIN.SETTINGS, payload)
      .then((res) => res.data),
}
