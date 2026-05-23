import * as React from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import {
  getManagedUser,
  updateManagedUser,
  userLabel,
  type ManagedOrgRole,
  type ManagedUser,
  type UserListItem,
} from '../services/usersService'

const ROLE_OPTIONS: ManagedOrgRole[] = [
  'owner',
  'admin',
  'coach',
  'athlete',
  'parent',
  'staff',
  'viewer',
]

function roleLabel(role: string) {
  return role.replace(/^./, (c) => c.toUpperCase())
}

function toInitialUser(value: unknown): UserListItem | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<UserListItem>
  return typeof raw.user_id === 'string' ? raw as UserListItem : null
}

export default function EditUserPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, loading: authLoading } = useAuth()
  const initialUser = toInitialUser((location.state as any)?.user)

  const [user, setUser] = React.useState<ManagedUser | null>(null)
  const [role, setRole] = React.useState<ManagedOrgRole>('viewer')
  const [isActive, setIsActive] = React.useState(true)
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const orgId = profile?.default_org_id?.trim() ?? ''

  React.useEffect(() => {
    let active = true

    async function loadUser() {
      if (authLoading) return
      if (!orgId) {
        setError('Missing org_id for this account.')
        return
      }
      if (!id.trim()) {
        setError('Missing user id.')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await getManagedUser({ userId: id, orgId })
        if (!active) return
        setUser(data)
        setRole(data.org_role ?? 'viewer')
        setIsActive(data.is_active ?? true)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load user.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadUser()

    return () => {
      active = false
    }
  }, [authLoading, id, orgId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedPassword = password.trim()
    if (trimmedPassword || confirmPassword.trim()) {
      if (trimmedPassword.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match.')
        return
      }
    }

    if (!orgId) {
      setError('Missing org_id for this account.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateManagedUser(id, {
        org_id: orgId,
        role,
        is_active: isActive,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
      })
      setUser(updated)
      setRole(updated.org_role ?? role)
      setIsActive(updated.is_active ?? isActive)
      setPassword('')
      setConfirmPassword('')
      setSuccess('User updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.full_name || userLabel(initialUser)
  const email = user?.email ?? null

  return (
    <Box sx={{ width: '100%', maxWidth: 760 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/settings/users')}
        sx={{ mb: 2 }}
      >
        Users
      </Button>

      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Edit User</Typography>
        <Typography variant="body2" color="text.secondary">
          {displayName}
          {email ? ` · ${email}` : ''}
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <TextField
              label="User ID"
              value={id}
              disabled
              fullWidth
            />

            <TextField
              select
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as ManagedOrgRole)}
              disabled={loading || saving}
              fullWidth
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {roleLabel(option)}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  disabled={loading || saving}
                />
              }
              label="Active organization membership"
            />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Reset Password</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading || saving}
                  fullWidth
                  autoComplete="new-password"
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading || saving}
                  fullWidth
                  autoComplete="new-password"
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/settings/users')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading || saving}
              >
                {saving ? 'Saving' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
