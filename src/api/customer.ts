import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { Favorite, User } from '@/types'

export const customerApi = {
  getProfile: () => apiClient.get<User>(API_ENDPOINTS.CUSTOMERS.PROFILE).then((res) => res.data),

  updateProfile: (payload: Partial<User>) =>
    apiClient.patch<User>(API_ENDPOINTS.CUSTOMERS.PROFILE, payload).then((res) => res.data),

  getFavorites: () =>
    apiClient.get<Favorite[]>(API_ENDPOINTS.CUSTOMERS.FAVORITES).then((res) => res.data),

  addFavorite: (restaurantId: string) =>
    apiClient
      .post<Favorite>(API_ENDPOINTS.CUSTOMERS.FAVORITES, { restaurantId })
      .then((res) => res.data),

  removeFavorite: (restaurantId: string) =>
    apiClient
      .delete<void>(`${API_ENDPOINTS.CUSTOMERS.FAVORITES}/${restaurantId}`)
      .then((res) => res.data),
}
