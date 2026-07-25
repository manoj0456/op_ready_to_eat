import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { MenuCategory, MenuItem } from '@/types'

export const menuApi = {
  getMenu: (restaurantId: string) =>
    apiClient
      .get<{ categories: MenuCategory[]; items: MenuItem[] }>(
        API_ENDPOINTS.MENUS.BY_RESTAURANT(restaurantId),
      )
      .then((res) => res.data),

  createCategory: (restaurantId: string, payload: Partial<MenuCategory>) =>
    apiClient
      .post<MenuCategory>(API_ENDPOINTS.MENUS.CATEGORIES(restaurantId), payload)
      .then((res) => res.data),

  createItem: (restaurantId: string, payload: Partial<MenuItem>) =>
    apiClient
      .post<MenuItem>(API_ENDPOINTS.MENUS.ITEMS(restaurantId), payload)
      .then((res) => res.data),

  updateItem: (restaurantId: string, itemId: string, payload: Partial<MenuItem>) =>
    apiClient
      .patch<MenuItem>(API_ENDPOINTS.MENUS.ITEM_BY_ID(restaurantId, itemId), payload)
      .then((res) => res.data),

  deleteItem: (restaurantId: string, itemId: string) =>
    apiClient.delete<void>(API_ENDPOINTS.MENUS.ITEM_BY_ID(restaurantId, itemId)).then((res) => res.data),
}
