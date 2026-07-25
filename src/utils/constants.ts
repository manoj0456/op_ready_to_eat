export const APP_NAME = 'ReadyToEat'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rte_access_token',
  ID_TOKEN: 'rte_id_token',
  REFRESH_TOKEN: 'rte_refresh_token',
  CART: 'rte_cart',
} as const

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const CURRENCY = 'USD'

export const PAGE_SIZE_DEFAULT = 20
