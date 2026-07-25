import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  Box,
  Chip,
  Container,
  Divider,
  Rating,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useRestaurant } from '@/hooks/useRestaurants'
import { menuApi } from '@/api/menu'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { formatCurrency } from '@/utils/formatters'

export function RestaurantDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: restaurant, isLoading: isRestaurantLoading } = useRestaurant(id)
  const { data: menu, isLoading: isMenuLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.getMenu(id as string),
    enabled: Boolean(id),
  })
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { showSnackbar } = useSnackbar()

  if (isRestaurantLoading || isMenuLoading) {
    return <LoadingSpinner fullScreen message="Loading restaurant..." />
  }

  if (!restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Restaurant not found.</Typography>
      </Container>
    )
  }

  const handleAdd = (itemId: string, name: string, price: number) => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER') {
      showSnackbar('Log in as a customer to order', 'warning')
      return
    }
    addItem({ menuItemId: itemId, restaurantId: restaurant.id, name, price, quantity: 1 })
    showSnackbar(`Added ${name} to cart`, 'success')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">{restaurant.name}</Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
        <Rating value={restaurant.rating} precision={0.5} size="small" readOnly />
        <Typography variant="body2" color="text.secondary">
          ({restaurant.reviewCount} reviews) &middot; {restaurant.estimatedDeliveryMinutes} min
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {restaurant.cuisine.map((c) => (
          <Chip key={c} label={c} size="small" />
        ))}
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {restaurant.description}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {menu?.categories.map((category) => (
        <Box key={category.id} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {category.name}
          </Typography>
          <Grid container spacing={2}>
            {menu.items
              .filter((item) => item.categoryId === category.id)
              .map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}
                  >
                    <Box>
                      <Typography variant="subtitle1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                        {formatCurrency(item.price)}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!item.isAvailable}
                      onClick={() => handleAdd(item.id, item.name, item.price)}
                    >
                      Add
                    </Button>
                  </Stack>
                </Grid>
              ))}
          </Grid>
        </Box>
      ))}
    </Container>
  )
}
