import { useState } from 'react'
import { Box, Toolbar } from '@mui/material'
import { Navbar } from './Navbar'
import { Sidebar, type SidebarItem } from './Sidebar'
import { Footer } from './Footer'
import type { ReactNode } from 'react'

export interface AppShellProps {
  children: ReactNode
  sidebarItems?: SidebarItem[]
  showFooter?: boolean
}

const SIDEBAR_WIDTH = 240

export function AppShell({ children, sidebarItems, showFooter = true }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasSidebar = Boolean(sidebarItems?.length)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} showMenuButton={hasSidebar} />

      {hasSidebar && sidebarItems && (
        <>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Sidebar items={sidebarItems} open onClose={() => {}} variant="permanent" width={SIDEBAR_WIDTH} />
          </Box>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Sidebar
              items={sidebarItems}
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              variant="temporary"
              width={SIDEBAR_WIDTH}
            />
          </Box>
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: hasSidebar ? { md: `calc(100% - ${SIDEBAR_WIDTH}px)` } : '100%',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>{children}</Box>
        {showFooter && <Footer />}
      </Box>
    </Box>
  )
}
