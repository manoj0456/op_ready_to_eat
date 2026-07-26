import {
  Chip,
  Container,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useRestaurantOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useSnackbar } from '@/hooks/useSnackbar'
import { formatCurrency, formatDate, formatDateTime, formatOrderStatus } from '@/utils/formatters'
import { ORDER_STATUS, type OrderStatus } from '@/utils/constants'

const STATUS_OPTIONS = Object.values(ORDER_STATUS)

export function RestaurantOrders() {
  const { user } = useAuth()
  const { data, isLoading } = useRestaurantOrders(user?.id)
  const updateStatus = useUpdateOrderStatus()
  const { showSnackbar } = useSnackbar()

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus.mutate(
      { id: orderId, status },
      {
        onSuccess: () => showSnackbar('Order status updated', 'success'),
        onError: () => showSnackbar('Unable to update order', 'error'),
      },
    )
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Orders" />

      {isLoading && <LoadingSpinner message="Loading orders..." />}

      {!isLoading && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Arrival</TableCell>
                <TableCell align="right">Guests</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(order.expectedArrivalTime)}</TableCell>
                  <TableCell align="right">{order.guestCount}</TableCell>
                  <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    {order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.DELIVERED ? (
                      <Chip label={formatOrderStatus(order.status)} size="small" />
                    ) : (
                      <Select
                        size="small"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <MenuItem key={status} value={status}>
                            {formatOrderStatus(status)}
                          </MenuItem>
                        ))}
                      </Select>
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
