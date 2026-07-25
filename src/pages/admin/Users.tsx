import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Chip,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSnackbar } from '@/hooks/useSnackbar'
import { adminApi } from '@/api/admin'

export function AdminUsers() {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showSnackbar('User removed', 'success')
    },
    onError: () => showSnackbar('Unable to remove user', 'error'),
  })

  return (
    <Container maxWidth="lg" disableGutters>
      <PageHeader title="Users" />

      {isLoading && <LoadingSpinner message="Loading users..." />}

      {!isLoading && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => deleteUser.mutate(user.id)} aria-label="remove user">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
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
