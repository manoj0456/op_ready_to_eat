import { useState } from 'react'
import {
  Box,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { useCart } from '@/hooks/useCart'
import { useCreateOrder } from '@/hooks/useOrders'
import { useSnackbar } from '@/hooks/useSnackbar'
import { formatCurrency } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'

export function Cart() {
  const { items, restaurantId, updateQuantity, removeItem, clearCart, subtotal } = useCart()
  const createOrder = useCreateOrder()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [address, setAddress] = useState({ line1: '', city: '', state: '', zipCode: '' })
  const [arrivalTime, setArrivalTime] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [specialInstructions, setSpecialInstructions] = useState('')

  const deliveryFee = items.length > 0 ? 4.99 : 0
  const total = subtotal + deliveryFee

  const handleCheckout = async () => {
    if (!restaurantId) return
    try {
      await createOrder.mutateAsync({
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        deliveryAddress: { ...address, country: 'US' },
        expectedArrivalTime: new Date(arrivalTime).toISOString(),
        guestCount,
        specialInstructions: specialInstructions || undefined,
      })
      clearCart()
      showSnackbar('Order placed!', 'success')
      navigate(ROUTES.CUSTOMER_ORDERS)
    } catch {
      showSnackbar('Unable to place order. Please try again.', 'error')
    }
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" disableGutters>
        <PageHeader title="Your Cart" />
        <Typography color="text.secondary">Your cart is empty.</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <PageHeader title="Your Cart" />

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2} divider={<Divider />}>
          {items.map((item) => (
            <Stack key={item.menuItemId} direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(item.price)}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography>{item.quantity}</Typography>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => removeItem(item.menuItemId)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Arrival details
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Expected arrival time"
            type="datetime-local"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
          <TextField
            label="Number of guests"
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
          />
          <TextField
            label="Special instructions"
            multiline
            minRows={2}
            fullWidth
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Delivery address
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Address line 1"
            fullWidth
            value={address.line1}
            onChange={(e) => setAddress((prev) => ({ ...prev, line1: e.target.value }))}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="City"
              fullWidth
              value={address.city}
              onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
            />
            <TextField
              label="State"
              fullWidth
              value={address.state}
              onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
            />
            <TextField
              label="ZIP"
              fullWidth
              value={address.zipCode}
              onChange={(e) => setAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
            />
          </Stack>
        </Stack>
      </Paper>

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography color="text.secondary">Subtotal</Typography>
          <Typography>{formatCurrency(subtotal)}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography color="text.secondary">Delivery fee</Typography>
          <Typography>{formatCurrency(deliveryFee)}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1">{formatCurrency(total)}</Typography>
        </Stack>
      </Stack>

      <Button
        variant="contained"
        size="large"
        fullWidth
        loading={createOrder.isPending}
        disabled={
          !arrivalTime || !address.line1 || !address.city || !address.state || !address.zipCode
        }
        onClick={handleCheckout}
      >
        Place order
      </Button>
    </Container>
  )
}
