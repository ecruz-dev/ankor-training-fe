// ManageUsersPage.tsx - Ankor Training App
// Data grid of users with a top search bar.
// Route: /settings/users

import * as React from 'react'
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import {
  deleteManagedUser,
  listUsers,
  type UserListItem,
  userLabel,
} from '../services/usersService'
import { useAuth } from '../../../app/providers/AuthProvider'

// ---- Types ----
export type UserRow = UserListItem

// ---- Helpers ----
const toDisplayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '-' : String(value)

export default function ManageUsersPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [searchText, setSearchText] = React.useState('')
  const [rows, setRows] = React.useState<UserRow[]>([])
  const [totalCount, setTotalCount] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadUsers = async () => {
      if (authLoading) {
        return
      }
      const resolvedOrgId = profile?.default_org_id?.trim()
      if (!resolvedOrgId) {
        setLoadError('Missing org_id for this account.')
        setRows([])
        setTotalCount(null)
        return
      }

      setLoading(true)
      setLoadError(null)
      try {
        const result = await listUsers({ orgId: resolvedOrgId })
        if (!active) return
        setRows(result.items)
        setTotalCount(result.count ?? result.items.length)
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load users.')
        setRows([])
        setTotalCount(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadUsers()

    return () => {
      active = false
    }
  }, [authLoading, profile])

  const filteredRows = React.useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const fields = [
        userLabel(r),
        r.user_id,
        r.role ?? '',
        r.phone ?? '',
        String(r.graduation_year ?? ''),
      ].map((value) => value.toLowerCase())
      return fields.some((value) => value.includes(q))
    })
  }, [rows, searchText])

  const handleDelete = React.useCallback(
    async (user: UserRow) => {
      const resolvedOrgId = profile?.default_org_id?.trim() || ''
      if (!resolvedOrgId) {
        setLoadError('Missing org_id for this account.')
        return
      }

      const confirmed = window.confirm(`Deactivate user "${userLabel(user)}"?`)
      if (!confirmed) return

      setDeletingId(user.user_id)
      setLoadError(null)
      try {
        await deleteManagedUser({ userId: user.user_id, orgId: resolvedOrgId })
        setRows((current) => current.filter((item) => item.user_id !== user.user_id))
        setTotalCount((current) =>
          typeof current === 'number' ? Math.max(0, current - 1) : current,
        )
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to deactivate user.')
      } finally {
        setDeletingId(null)
      }
    },
    [profile],
  )

  const columns = React.useMemo<GridColDef<UserRow>[]>(
    () => [
      {
        field: 'full_name',
        headerName: 'Name',
        flex: 1.4,
        minWidth: 200,
        valueGetter: (_value, row) => userLabel(row),
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 120,
        valueFormatter: (value) => {
          const formattedValue = String(value ?? '').trim()
          return formattedValue
            ? formattedValue.replace(/^./, (c) => c.toUpperCase())
            : '-'
        },
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 140,
        valueFormatter: (value) => toDisplayValue(value as string | null),
      },
      {
        field: 'graduation_year',
        headerName: 'Grad Year',
        width: 110,
        valueFormatter: (value) => toDisplayValue(value as number | null),
      },
      { field: 'user_id', headerName: 'User ID', flex: 1.2, minWidth: 220 },
      {
        field: 'actions',
        headerName: '',
        width: 250,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                navigate(`/settings/users/${params.row.user_id}/edit`, {
                  state: { user: params.row },
                })
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={deletingId === params.row.user_id}
              onClick={() => {
                void handleDelete(params.row)
              }}
            >
              Deactivate
            </Button>
          </Stack>
        ),
      },
    ],
    [deletingId, handleDelete, navigate],
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Manage Users</Typography>
          <Typography variant="body2" color="text.secondary">
            {(totalCount ?? rows.length).toLocaleString()} users
          </Typography>
        </Box>
      </Stack>

      {loadError && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="body2">{loadError}</Typography>
        </Box>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
        <TextField
          size="small"
          placeholder="Search name, phone, role, grad year, user ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )}}
          sx={{ minWidth: 280, maxWidth: 420 }}
        />
      </Stack>

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          getRowId={(r) => r.user_id}
          columns={columns}
          disableRowSelectionOnClick
          loading={loading}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 10 } },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    </Box>
  )
}
