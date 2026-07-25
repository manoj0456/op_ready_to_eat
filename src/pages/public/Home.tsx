import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Link } from 'react-router-dom'
import DeliveryDiningOutlinedIcon from '@mui/icons-material/DeliveryDiningOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { ROUTES } from '@/constants/routes'
import { APP_NAME } from '@/utils/constants'

const FEATURES = [
  {
    icon: StorefrontOutlinedIcon,
    title: 'Browse local restaurants',
    description: 'Explore menus from restaurants near you, updated in real time.',
  },
  {
    icon: DeliveryDiningOutlinedIcon,
    title: 'Fast delivery tracking',
    description: 'Track your order from the kitchen to your door.',
  },
  {
    icon: PaymentsOutlinedIcon,
    title: 'Simple checkout',
    description: 'Pay securely and reorder your favorites in a couple of taps.',
  },
]

export function Home() {
  return (
    <Box>
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="flex-start">
            <Typography variant="h2" component="h1">
              Great food, delivered.
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              {APP_NAME} connects you with the best restaurants in your area.
            </Typography>
            <Button
              component={Link}
              to={ROUTES.RESTAURANTS}
              variant="contained"
              color="secondary"
              size="large"
            >
              Browse restaurants
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={4}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 4, height: '100%' }}>
                  <Icon color="primary" sx={{ fontSize: 36, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}
