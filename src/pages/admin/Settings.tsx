import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container, FormControlLabel, Paper, Stack, Switch, TextField } from '@mui/material'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSnackbar } from '@/hooks/useSnackbar'
import { adminApi } from '@/api/admin'

export function AdminSettings() {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  })

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [platformFee, setPlatformFee] = useState('0')

  useEffect(() => {
    if (data) {
      setMaintenanceMode(Boolean(data.maintenanceMode))
      setPlatformFee(String(data.platformFee ?? '0'))
    }
  }, [data])

  const updateSettings = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({ maintenanceMode, platformFee: Number(platformFee) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      showSnackbar('Settings saved', 'success')
    },
    onError: () => showSnackbar('Unable to save settings', 'error'),
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <PageHeader title="Platform Settings" />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            }
            label="Maintenance mode"
          />
          <TextField
            label="Platform fee (%)"
            type="number"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
          />
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
