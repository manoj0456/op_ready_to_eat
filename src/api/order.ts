import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { Address, Order, OrderItem, OrderStatus, PaginatedResponse } from '@/types'

export interface CreateOrderPayload {
  restaurantId: string
  items: Pick<OrderItem, 'menuItemId' | 'quantity' | 'notes'>[]
  deliveryAddress: Address
}

export interface OrderListParams {
  page?: number
  pageSize?: number
  status?: OrderStatus
}

export const orderApi = {
  create: (payload: CreateOrderPayload) =>
    apiClient.post<Order>(API_ENDPOINTS.ORDERS.BASE, payload).then((res) => res.data),

  getById: (id: string) => apiClient.get<Order>(API_ENDPOINTS.ORDERS.BY_ID(id)).then((res) => res.data),

  listMyOrders: (params?: OrderListParams) =>
    apiClient
      .get<PaginatedResponse<Order>>(API_ENDPOINTS.ORDERS.BASE, { params })
      .then((res) => res.data),

  listByRestaurant: (restaurantId: string, params?: OrderListParams) =>
    apiClient
      .get<PaginatedResponse<Order>>(API_ENDPOINTS.ORDERS.BY_RESTAURANT(restaurantId), { params })
      .then((res) => res.data),

  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(API_ENDPOINTS.ORDERS.BY_ID(id), { status }).then((res) => res.data),

  cancel: (id: string) =>
    apiClient
      .patch<Order>(API_ENDPOINTS.ORDERS.BY_ID(id), { status: 'CANCELLED' })
      .then((res) => res.data),
}
