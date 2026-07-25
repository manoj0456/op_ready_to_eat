import { Card, CardContent, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useRestaurantOrders } from '@/hooks/useOrders'
import { formatCurrency } from '@/utils/formatters'
import { ORDER_STATUS } from '@/utils/constants'

export function RestaurantDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useRestaurantOrders(user?.id)

  const stats = useMemo(() => {
    const orders = data?.items ?? []
    const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length
    const revenue = orders
      .filter((o) => o.status === ORDER_STATUS.DELIVERED)
      .reduce((sum, o) => sum + o.total, 0)
    return [
      { label: 'Total orders', value: orders.length },
      { label: 'Pending orders', value: pending },
      { label: 'Revenue (delivered)', value: formatCurrency(revenue) },
    ]
  }, [data])

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Restaurant Dashboard" subtitle="Overview of your restaurant's activity" />

      {isLoading && <LoadingSpinner message="Loading dashboard..." />}

      <Grid container spacing={2}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
