import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Container,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useSnackbar } from '@/hooks/useSnackbar'
import { menuApi } from '@/api/menu'
import { formatCurrency } from '@/utils/formatters'

export function RestaurantMenu() {
  const { user } = useAuth()
  const restaurantId = user?.id ?? ''
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', price: '', categoryId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => menuApi.getMenu(restaurantId),
    enabled: Boolean(restaurantId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] })

  const createItem = useMutation({
    mutationFn: () =>
      menuApi.createItem(restaurantId, {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        categoryId: draft.categoryId || data?.categories[0]?.id,
        isAvailable: true,
      }),
    onSuccess: () => {
      invalidate()
      setIsModalOpen(false)
      setDraft({ name: '', description: '', price: '', categoryId: '' })
      showSnackbar('Menu item added', 'success')
    },
    onError: () => showSnackbar('Unable to add item', 'error'),
  })

  const toggleAvailability = useMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) =>
      menuApi.updateItem(restaurantId, itemId, { isAvailable }),
    onSuccess: invalidate,
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => menuApi.deleteItem(restaurantId, itemId),
    onSuccess: invalidate,
  })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader
        title="Menu"
        actions={
          <Button variant="contained" onClick={() => setIsModalOpen(true)}>
            Add item
          </Button>
        }
      />

      {isLoading && <LoadingSpinner message="Loading menu..." />}

      <Stack spacing={2}>
        {data?.items.map((item) => (
          <Stack
            key={item.id}
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(item.price)}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={item.isAvailable}
                onChange={(e) =>
                  toggleAvailability.mutate({ itemId: item.id, isAvailable: e.target.checked })
                }
              />
              <IconButton onClick={() => deleteItem.mutate(item.id)} aria-label="delete item">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Modal
        open={isModalOpen}
        title="Add menu item"
        onClose={() => setIsModalOpen(false)}
        actions={
          <Button variant="contained" loading={createItem.isPending} onClick={() => createItem.mutate()}>
            Save item
          </Button>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            label="Price"
            type="number"
            fullWidth
            value={draft.price}
            onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
          />
        </Stack>
      </Modal>
    </Container>
  )
}
