import { Outlet } from 'react-router-dom'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { AppShell } from '@/components/layout/AppShell'
import type { SidebarItem } from '@/components/layout/Sidebar'
import { ROUTES } from '@/constants/routes'

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: ROUTES.CUSTOMER_DASHBOARD, icon: DashboardOutlinedIcon },
  { label: 'Orders', path: ROUTES.CUSTOMER_ORDERS, icon: ReceiptLongOutlinedIcon },
  { label: 'Cart', path: ROUTES.CUSTOMER_CART, icon: ShoppingCartOutlinedIcon },
  { label: 'Profile', path: ROUTES.CUSTOMER_PROFILE, icon: PersonOutlineIcon },
]

export function CustomerLayout() {
  return (
    <AppShell sidebarItems={sidebarItems}>
      <Outlet />
    </AppShell>
  )
}
