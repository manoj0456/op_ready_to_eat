import { useQuery } from '@tanstack/react-query'
import { restaurantApi, type RestaurantListParams } from '@/api/restaurant'

export function useRestaurants(params?: RestaurantListParams) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: () => restaurantApi.list(params),
  })
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantApi.getById(id as string),
    enabled: Boolean(id),
  })
}
