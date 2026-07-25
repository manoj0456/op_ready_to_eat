import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Container, Paper, Stack, Typography } from '@mui/material'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/forms/FormField'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { customerApi } from '@/api/customer'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function Profile() {
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()

  const { control, handleSubmit } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) => customerApi.updateProfile(values),
    onSuccess: () => showSnackbar('Profile updated', 'success'),
    onError: () => showSnackbar('Unable to update profile', 'error'),
  })

  return (
    <Container maxWidth="sm" disableGutters>
      <PageHeader title="Profile" />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user?.email}
        </Typography>
        <Stack
          component="form"
          spacing={2}
          onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
        >
          <FormField name="name" control={control} label="Full name" />
          <FormField name="phone" control={control} label="Phone number" />
          <Button type="submit" variant="contained" loading={updateProfile.isPending}>
            Save changes
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
