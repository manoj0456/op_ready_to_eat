import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { adminApi } from '@/api/admin'

export function AdminDashboard() {
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users', { page: 1 }],
    queryFn: () => adminApi.listUsers({ page: 1, pageSize: 1 }),
  })
  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ['admin-restaurants', { page: 1 }],
    queryFn: () => adminApi.listRestaurants({ page: 1, pageSize: 1 }),
  })

  const isLoading = isUsersLoading || isRestaurantsLoading

  const stats = [
    { label: 'Total users', value: users?.total ?? 0 },
    { label: 'Total restaurants', value: restaurants?.total ?? 0 },
  ]

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />

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
