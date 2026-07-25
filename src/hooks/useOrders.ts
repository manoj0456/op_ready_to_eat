import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderApi, type CreateOrderPayload, type OrderListParams } from '@/api/order'
import type { OrderStatus } from '@/types'

export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderApi.listMyOrders(params),
  })
}

export function useRestaurantOrders(restaurantId: string | undefined, params?: OrderListParams) {
  return useQuery({
    queryKey: ['restaurant-orders', restaurantId, params],
    queryFn: () => orderApi.listByRestaurant(restaurantId as string, params),
    enabled: Boolean(restaurantId),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
    },
  })
}
