export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  RESTAURANTS: {
    BASE: '/restaurants',
    BY_ID: (id: string) => `/restaurants/${id}`,
    SETTINGS: (id: string) => `/restaurants/${id}/settings`,
    ANALYTICS: (id: string) => `/restaurants/${id}/analytics`,
  },
  MENUS: {
    BY_RESTAURANT: (restaurantId: string) => `/restaurants/${restaurantId}/menu`,
    CATEGORIES: (restaurantId: string) => `/restaurants/${restaurantId}/menu/categories`,
    ITEMS: (restaurantId: string) => `/restaurants/${restaurantId}/menu/items`,
    ITEM_BY_ID: (restaurantId: string, itemId: string) =>
      `/restaurants/${restaurantId}/menu/items/${itemId}`,
  },
  CUSTOMERS: {
    PROFILE: '/customers/profile',
    FAVORITES: '/customers/favorites',
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    BY_RESTAURANT: (restaurantId: string) => `/restaurants/${restaurantId}/orders`,
  },
  ADMIN: {
    USERS: '/admin/users',
    RESTAURANTS: '/admin/restaurants',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
} as const

export const REQUEST_TIMEOUT_MS = 15000
