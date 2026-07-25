import { Card, CardContent, Container, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { ROUTES } from '@/constants/routes'
import { formatCurrency, formatDate, formatOrderStatus } from '@/utils/formatters'

export function CustomerDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useOrders({ pageSize: 5 })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title={`Welcome back, ${user?.name ?? 'there'}`} subtitle="Here's what's happening with your orders" />

      {isLoading && <LoadingSpinner message="Loading your orders..." />}

      <Grid container spacing={2}>
        {data?.items.map((order) => (
          <Grid key={order.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              variant="outlined"
              component={Link}
              to={ROUTES.CUSTOMER_ORDERS}
              sx={{ textDecoration: 'none', display: 'block' }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1">{order.restaurantName}</Typography>
                  <Typography variant="body2" color="primary">
                    {formatOrderStatus(order.status)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(order.createdAt)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {formatCurrency(order.total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!isLoading && data?.items.length === 0 && (
        <Typography color="text.secondary">
          You haven&apos;t placed any orders yet. <Link to={ROUTES.RESTAURANTS}>Browse restaurants</Link>
        </Typography>
      )}
    </Container>
  )
}
