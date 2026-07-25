import { Outlet } from 'react-router-dom'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { AppShell } from '@/components/layout/AppShell'
import type { SidebarItem } from '@/components/layout/Sidebar'
import { ROUTES } from '@/constants/routes'

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: DashboardOutlinedIcon },
  { label: 'Users', path: ROUTES.ADMIN_USERS, icon: GroupOutlinedIcon },
  { label: 'Restaurants', path: ROUTES.ADMIN_RESTAURANTS, icon: StorefrontOutlinedIcon },
  { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: AssessmentOutlinedIcon },
  { label: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: SettingsOutlinedIcon },
]

export function AdminLayout() {
  return (
    <AppShell sidebarItems={sidebarItems}>
      <Outlet />
    </AppShell>
  )
}
