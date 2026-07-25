import { Outlet } from 'react-router-dom'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import { AppShell } from '@/components/layout/AppShell'
import type { SidebarItem } from '@/components/layout/Sidebar'
import { ROUTES } from '@/constants/routes'

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: ROUTES.RESTAURANT_DASHBOARD, icon: DashboardOutlinedIcon },
  { label: 'Orders', path: ROUTES.RESTAURANT_ORDERS, icon: ReceiptLongOutlinedIcon },
  { label: 'Menu', path: ROUTES.RESTAURANT_MENU, icon: RestaurantMenuOutlinedIcon },
  { label: 'Settings', path: ROUTES.RESTAURANT_SETTINGS, icon: SettingsOutlinedIcon },
  { label: 'Analytics', path: ROUTES.RESTAURANT_ANALYTICS, icon: InsightsOutlinedIcon },
]

export function RestaurantLayout() {
  return (
    <AppShell sidebarItems={sidebarItems}>
      <Outlet />
    </AppShell>
  )
}
