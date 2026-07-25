import { Button as MuiButton, CircularProgress } from '@mui/material'
import type { ButtonProps as MuiButtonProps } from '@mui/material'

export interface ButtonProps extends MuiButtonProps {
  loading?: boolean
}

export function Button({ loading = false, disabled, children, startIcon, ...rest }: ButtonProps) {
  return (
    <MuiButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    >
      {children}
    </MuiButton>
  )
}
