import { createContext, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AppSnackbar } from '@/components/common/Snackbar'

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void
}

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'info') => {
    setState({ open: true, message, severity })
  }, [])

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const value = useMemo<SnackbarContextValue>(() => ({ showSnackbar }), [showSnackbar])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <AppSnackbar
        open={state.open}
        message={state.message}
        severity={state.severity}
        onClose={handleClose}
      />
    </SnackbarContext.Provider>
  )
}
