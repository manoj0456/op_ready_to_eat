import { Controller } from 'react-hook-form'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material'

export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  label: string
  options: FormSelectOption[]
}

export function FormSelect<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  options,
}: FormSelectProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={Boolean(fieldState.error)}>
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select {...field} value={field.value ?? ''} labelId={`${name}-label`} label={label}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error?.message && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
