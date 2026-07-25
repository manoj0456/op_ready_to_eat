import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/constants/roles'

const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: ROUTES.CUSTOMER_DASHBOARD,
  RESTAURANT: ROUTES.RESTAURANT_DASHBOARD,
  ADMIN: ROUTES.ADMIN_DASHBOARD,
}

export interface RoleRouteProps {
  allowedRoles: Role[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  return <Outlet />
}
