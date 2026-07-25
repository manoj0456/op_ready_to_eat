import { TextField } from '@mui/material'
import type { TextFieldProps } from '@mui/material'
import { forwardRef } from 'react'

export type InputProps = TextFieldProps

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return <TextField inputRef={ref} fullWidth variant="outlined" size="medium" {...props} />
})
