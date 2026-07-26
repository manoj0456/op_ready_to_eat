import type { Role } from '@/constants/roles'
import type { OrderStatus } from '@/utils/constants'

export type { Role, OrderStatus }

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone?: string
  avatarUrl?: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

export interface Restaurant {
  id: string
  ownerId: string
  name: string
  description: string
  cuisine: string[]
  address: Address
  coverImageUrl?: string
  logoUrl?: string
  rating: number
  reviewCount: number
  priceRange: 1 | 2 | 3 | 4
  isOpen: boolean
  deliveryFee: number
  minOrderAmount: number
  estimatedDeliveryMinutes: number
  createdAt: string
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  zipCode: string
  country: string
  lat?: number
  lng?: number
}

export interface RestaurantSettings {
  restaurantId: string
  acceptingOrders: boolean
  openingHours: OpeningHours[]
  taxRate: number
  paymentMethods: string[]
}

export interface OpeningHours {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  openTime: string
  closeTime: string
  closed: boolean
}

export interface MenuCategory {
  id: string
  restaurantId: string
  name: string
  displayOrder: number
}

export interface MenuItem {
  id: string
  restaurantId: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  isVegetarian: boolean
  tags: string[]
}

export interface CartItem {
  menuItemId: string
  restaurantId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  customerId: string
  restaurantId: string
  restaurantName: string
  items: OrderItem[]
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  deliveryAddress: Address
  expectedArrivalTime: string
  guestCount: number
  specialInstructions?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Review {
  id: string
  restaurantId: string
  customerId: string
  customerName: string
  orderId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Favorite {
  customerId: string
  restaurantId: string
  createdAt: string
}

export interface Coupon {
  id: string
  code: string
  restaurantId?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number
  expiresAt: string
  isActive: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}
