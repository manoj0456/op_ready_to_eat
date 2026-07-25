import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Container, Link as MuiLink, Paper, Stack, TextField, Typography } from '@mui/material'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/forms/FormField'
import { FormSelect } from '@/components/forms/FormSelect'
import { signupFormSchema, type SignupFormFullValues } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { confirmSignUp } from '@/services/cognitoService'
import { ROUTES } from '@/constants/routes'

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'I want to order food' },
  { value: 'RESTAURANT', label: 'I want to sell food' },
]

export function Signup() {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const { signup } = useAuth()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const { control, handleSubmit, formState } = useForm<SignupFormFullValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'CUSTOMER' },
  })

  const onSubmit = async (values: SignupFormFullValues) => {
    setSubmitError(null)
    try {
      await signup(values.email, values.password, {
        name: values.name,
        role: values.role as 'CUSTOMER' | 'RESTAURANT',
      })
      setPendingEmail(values.email)
      setStep('confirm')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to sign up')
    }
  }

  const handleConfirm = async () => {
    setSubmitError(null)
    setIsConfirming(true)
    try {
      await confirmSignUp(pendingEmail, code)
      showSnackbar('Account confirmed. Please log in.', 'success')
      navigate(ROUTES.LOGIN)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Invalid confirmation code')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        {step === 'form' ? (
          <>
            <Typography variant="h5" gutterBottom>
              Create an account
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormField name="name" control={control} label="Full name" />
                <FormField name="email" control={control} label="Email" type="email" />
                <FormField name="password" control={control} label="Password" type="password" />
                <FormField
                  name="confirmPassword"
                  control={control}
                  label="Confirm password"
                  type="password"
                />
                <FormSelect name="role" control={control} label="Account type" options={ROLE_OPTIONS} />
                {submitError && (
                  <Typography variant="body2" color="error">
                    {submitError}
                  </Typography>
                )}
                <Button type="submit" variant="contained" size="large" loading={formState.isSubmitting}>
                  Sign up
                </Button>
              </Stack>
            </Box>
            <Typography variant="body2" sx={{ mt: 3 }} align="center">
              Already have an account?{' '}
              <MuiLink component={Link} to={ROUTES.LOGIN}>
                Log in
              </MuiLink>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              Confirm your email
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We sent a verification code to {pendingEmail}.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Verification code"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {submitError && (
                <Typography variant="body2" color="error">
                  {submitError}
                </Typography>
              )}
              <Button variant="contained" size="large" onClick={handleConfirm} loading={isConfirming}>
                Confirm
              </Button>
            </Stack>
          </>
        )}
      </Paper>
    </Container>
  )
}
