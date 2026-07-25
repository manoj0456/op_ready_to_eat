import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, Container, Link as MuiLink, Paper, Stack, Typography } from '@mui/material'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/forms/FormField'
import { loginSchema, type LoginFormValues } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/constants/roles'

const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: ROUTES.CUSTOMER_DASHBOARD,
  RESTAURANT: ROUTES.RESTAURANT_DASHBOARD,
  ADMIN: ROUTES.ADMIN_DASHBOARD,
}

export function Login() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { login } = useAuth()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const location = useLocation()

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null)
    try {
      const user = await login(values.email, values.password)
      showSnackbar('Welcome back!', 'success')
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? ROLE_HOME[user.role], { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to log in')
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Log in
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormField name="email" control={control} label="Email" type="email" />
            <FormField name="password" control={control} label="Password" type="password" />
            {submitError && (
              <Typography variant="body2" color="error">
                {submitError}
              </Typography>
            )}
            <Button type="submit" variant="contained" size="large" loading={formState.isSubmitting}>
              Log in
            </Button>
          </Stack>
        </Box>
        <Typography variant="body2" sx={{ mt: 3 }} align="center">
          Don&apos;t have an account?{' '}
          <MuiLink component={Link} to={ROUTES.SIGNUP}>
            Sign up
          </MuiLink>
        </Typography>
      </Paper>
    </Container>
  )
}
