import { Box, CircularProgress, Typography } from '@mui/material'

export interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
  size?: number
}

export function LoadingSpinner({ message, fullScreen = false, size = 40 }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: '100%',
        height: fullScreen ? '100vh' : '100%',
        py: fullScreen ? 0 : 6,
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )
}
