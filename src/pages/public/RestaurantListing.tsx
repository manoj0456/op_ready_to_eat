import { useState } from 'react'
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  InputAdornment,
  Rating,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common/Input'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PageHeader } from '@/components/layout/PageHeader'
import { useRestaurants } from '@/hooks/useRestaurants'
import { ROUTES } from '@/constants/routes'

export function RestaurantListing() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useRestaurants({ search: search || undefined })
  const navigate = useNavigate()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Restaurants" subtitle="Order from top-rated restaurants near you" />

      <Input
        placeholder="Search restaurants or cuisines"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4, maxWidth: 480 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading && <LoadingSpinner message="Loading restaurants..." />}
      {isError && (
        <Typography color="error">Could not load restaurants. Please try again.</Typography>
      )}

      <Grid container spacing={3}>
        {data?.items.map((restaurant) => (
          <Grid key={restaurant.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate(ROUTES.restaurantDetail(restaurant.id))}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    bgcolor: 'grey.200',
                    backgroundImage: restaurant.coverImageUrl
                      ? `url(${restaurant.coverImageUrl})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <CardContent>
                  <Typography variant="h6">{restaurant.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                    <Rating value={restaurant.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary">
                      ({restaurant.reviewCount})
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {restaurant.cuisine.slice(0, 3).map((c) => (
                      <Chip key={c} label={c} size="small" />
                    ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!isLoading && data?.items.length === 0 && (
        <Typography color="text.secondary">No restaurants found.</Typography>
      )}
    </Container>
  )
}
