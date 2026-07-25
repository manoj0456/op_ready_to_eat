import { Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

export function PublicLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
