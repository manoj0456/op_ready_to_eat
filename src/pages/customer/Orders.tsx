import {
  Chip,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency, formatDate, formatDateTime, formatOrderStatus } from '@/utils/formatters'
import { ORDER_STATUS } from '@/utils/constants'

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.CONFIRMED]: 'info',
  [ORDER_STATUS.PREPARING]: 'info',
  [ORDER_STATUS.READY]: 'info',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'info',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'error',
}

export function CustomerOrders() {
  const { data, isLoading } = useOrders()

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="My Orders" />

      {isLoading && <LoadingSpinner message="Loading orders..." />}

      {!isLoading && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Restaurant</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Arrival</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.restaurantName}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(order.expectedArrivalTime)}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatOrderStatus(order.status)}
                      size="small"
                      color={STATUS_COLOR[order.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
