import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { restaurantApi } from '@/api/restaurant'

export function RestaurantAnalytics() {
  const { user } = useAuth()
  const restaurantId = user?.id ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-analytics', restaurantId],
    queryFn: () => restaurantApi.getAnalytics(restaurantId),
    enabled: Boolean(restaurantId),
  })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Analytics" subtitle="Performance over the last 30 days" />

      {isLoading && <LoadingSpinner message="Loading analytics..." />}

      {!isLoading && (
        <Grid container spacing={2}>
          {Object.entries(data ?? {}).map(([key, value]) => (
            <Grid key={key} size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                  <Typography variant="h5">{String(value)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {data && Object.keys(data).length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary">No analytics data available yet.</Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  )
}
