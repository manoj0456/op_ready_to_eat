import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { adminApi } from '@/api/admin'

export function AdminReports() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminApi.getReports(),
  })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Reports" subtitle="Platform-wide metrics" />

      {isLoading && <LoadingSpinner message="Loading reports..." />}

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
              <Typography color="text.secondary">No report data available yet.</Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  )
}
