import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { restaurantApi } from '@/api/restaurant'

export function RestaurantSettings() {
  const { user } = useAuth()
  const restaurantId = user?.id ?? ''
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-settings', restaurantId],
    queryFn: () => restaurantApi.getSettings(restaurantId),
    enabled: Boolean(restaurantId),
  })

  const [acceptingOrders, setAcceptingOrders] = useState(true)
  const [taxRate, setTaxRate] = useState('0')

  useEffect(() => {
    if (data) {
      setAcceptingOrders(data.acceptingOrders)
      setTaxRate(String(data.taxRate))
    }
  }, [data])

  const updateSettings = useMutation({
    mutationFn: () =>
      restaurantApi.updateSettings(restaurantId, {
        acceptingOrders,
        taxRate: Number(taxRate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings', restaurantId] })
      showSnackbar('Settings saved', 'success')
    },
    onError: () => showSnackbar('Unable to save settings', 'error'),
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <PageHeader title="Settings" />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch checked={acceptingOrders} onChange={(e) => setAcceptingOrders(e.target.checked)} />
            }
            label="Accepting new orders"
          />
          <TextField
            label="Tax rate (%)"
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary">
            Changes apply to future orders only.
          </Typography>
          <Button
            variant="contained"
            loading={updateSettings.isPending}
            onClick={() => updateSettings.mutate()}
          >
            Save settings
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
