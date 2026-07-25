import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link, useLocation } from 'react-router-dom'

export interface SidebarItem {
  label: string
  path: string
  icon: SvgIconComponent
}

export interface SidebarProps {
  items: SidebarItem[]
  open: boolean
  onClose: () => void
  variant?: 'permanent' | 'temporary'
  width?: number
}

export function Sidebar({ items, open, onClose, variant = 'permanent', width = 240 }: SidebarProps) {
  const location = useLocation()

  const content = (
    <>
      <Toolbar />
      <List sx={{ px: 1 }}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={isActive}
              onClick={variant === 'temporary' ? onClose : undefined}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" color={isActive ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </>
  )

  return (
    <Drawer
      variant={variant}
      open={variant === 'permanent' ? true : open}
      onClose={onClose}
      sx={{
        width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width, boxSizing: 'border-box' },
      }}
    >
      {content}
    </Drawer>
  )
}
