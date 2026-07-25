import { Alert, Snackbar as MuiSnackbar } from '@mui/material'
import type { SnackbarSeverity } from '@/context/SnackbarContext'

export interface AppSnackbarProps {
  open: boolean
  message: string
  severity: SnackbarSeverity
  onClose: () => void
}

export function AppSnackbar({ open, message, severity, onClose }: AppSnackbarProps) {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </MuiSnackbar>
  )
}
