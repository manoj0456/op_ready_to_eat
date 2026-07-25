import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSnackbar } from '@/hooks/useSnackbar'
import { adminApi } from '@/api/admin'

export function AdminRestaurants() {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => adminApi.listRestaurants(),
  })

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
      showSnackbar('Restaurant approved', 'success')
    },
    onError: () => showSnackbar('Unable to approve restaurant', 'error'),
  })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Restaurants" />

      {isLoading && <LoadingSpinner message="Loading restaurants..." />}

      {!isLoading && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Cuisine</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((restaurant) => (
                <TableRow key={restaurant.id} hover>
                  <TableCell>{restaurant.name}</TableCell>
                  <TableCell>{restaurant.cuisine.join(', ')}</TableCell>
                  <TableCell>
                    <Chip
                      label={restaurant.isOpen ? 'Active' : 'Pending'}
                      size="small"
                      color={restaurant.isOpen ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {!restaurant.isOpen && (
                      <Button size="small" onClick={() => approve.mutate(restaurant.id)}>
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
