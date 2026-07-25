import { Controller } from 'react-hook-form'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { TextField } from '@mui/material'

export interface FormDatePickerProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  label: string
  minDate?: string
}

export function FormDatePicker<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  minDate,
}: FormDatePickerProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          type="date"
          label={label}
          fullWidth
          variant="outlined"
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minDate } }}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  )
}
