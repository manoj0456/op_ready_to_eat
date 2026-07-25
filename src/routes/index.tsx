import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { RestaurantLayout } from '@/layouts/RestaurantLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants/roles'

import { Home } from '@/pages/public/Home'
import { Login } from '@/pages/public/Login'
import { Signup } from '@/pages/public/Signup'
import { RestaurantListing } from '@/pages/public/RestaurantListing'
import { RestaurantDetail } from '@/pages/public/RestaurantDetail'

import { CustomerDashboard } from '@/pages/customer/Dashboard'
import { CustomerOrders } from '@/pages/customer/Orders'
import { Cart } from '@/pages/customer/Cart'
import { Profile } from '@/pages/customer/Profile'

import { RestaurantDashboard } from '@/pages/restaurant/Dashboard'
import { RestaurantOrders } from '@/pages/restaurant/Orders'
import { RestaurantMenu } from '@/pages/restaurant/Menu'
import { RestaurantSettings } from '@/pages/restaurant/Settings'
import { RestaurantAnalytics } from '@/pages/restaurant/Analytics'

import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminUsers } from '@/pages/admin/Users'
import { AdminRestaurants } from '@/pages/admin/Restaurants'
import { AdminReports } from '@/pages/admin/Reports'
import { AdminSettings } from '@/pages/admin/Settings'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.SIGNUP, element: <Signup /> },
      { path: ROUTES.RESTAURANTS, element: <RestaurantListing /> },
      { path: ROUTES.RESTAURANT_DETAIL, element: <RestaurantDetail /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={[ROLES.CUSTOMER]} />,
        children: [
          {
            element: <CustomerLayout />,
            children: [
              { path: ROUTES.CUSTOMER_DASHBOARD, element: <CustomerDashboard /> },
              { path: ROUTES.CUSTOMER_ORDERS, element: <CustomerOrders /> },
              { path: ROUTES.CUSTOMER_CART, element: <Cart /> },
              { path: ROUTES.CUSTOMER_PROFILE, element: <Profile /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[ROLES.RESTAURANT]} />,
        children: [
          {
            element: <RestaurantLayout />,
            children: [
              { path: ROUTES.RESTAURANT_DASHBOARD, element: <RestaurantDashboard /> },
              { path: ROUTES.RESTAURANT_ORDERS, element: <RestaurantOrders /> },
              { path: ROUTES.RESTAURANT_MENU, element: <RestaurantMenu /> },
              { path: ROUTES.RESTAURANT_SETTINGS, element: <RestaurantSettings /> },
              { path: ROUTES.RESTAURANT_ANALYTICS, element: <RestaurantAnalytics /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[ROLES.ADMIN]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: ROUTES.ADMIN_DASHBOARD, element: <AdminDashboard /> },
              { path: ROUTES.ADMIN_USERS, element: <AdminUsers /> },
              { path: ROUTES.ADMIN_RESTAURANTS, element: <AdminRestaurants /> },
              { path: ROUTES.ADMIN_REPORTS, element: <AdminReports /> },
              { path: ROUTES.ADMIN_SETTINGS, element: <AdminSettings /> },
            ],
          },
        ],
      },
    ],
  },
])
