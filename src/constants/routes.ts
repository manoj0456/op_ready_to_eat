export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: '/restaurants/:id',
  restaurantDetail: (id: string) => `/restaurants/${id}`,

  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_CART: '/customer/cart',
  CUSTOMER_PROFILE: '/customer/profile',

  RESTAURANT_DASHBOARD: '/restaurant/dashboard',
  RESTAURANT_ORDERS: '/restaurant/orders',
  RESTAURANT_MENU: '/restaurant/menu',
  RESTAURANT_SETTINGS: '/restaurant/settings',
  RESTAURANT_ANALYTICS: '/restaurant/analytics',

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESTAURANTS: '/admin/restaurants',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
} as const
