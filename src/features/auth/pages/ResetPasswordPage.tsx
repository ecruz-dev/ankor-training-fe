import * as React from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  CssBaseline,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import AppTheme from '../theme/AppTheme'
import ColorModeSelect from '../theme/ColorModeSelect'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const nextPassword = password.trim()
    if (nextPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (nextPassword !== confirmPassword.trim()) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const { error: updateError } = await updatePassword(nextPassword)
      if (updateError) {
        setError(updateError.message || 'Unable to update password.')
        return
      }
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />

      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
          backgroundColor: 'background.default',
        }}
      >
        <Card
          variant="outlined"
          sx={{
            width: '100%',
            maxWidth: 460,
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter a new password for your account.
              </Typography>
            </Box>

            {success ? (
              <Stack spacing={2}>
                <Alert severity="success">
                  Password updated. You can now sign in with your new password.
                </Alert>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/sign-in"
                  sx={{ textTransform: 'none' }}
                >
                  Back to sign in
                </Button>
              </Stack>
            ) : (
              <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
                <TextField
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm new password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          aria-label={
                            showConfirmPassword ? 'Hide password' : 'Show password'
                          }
                        >
                          {showConfirmPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={busy}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none' }}
                >
                  {busy ? <CircularProgress color="inherit" size={22} /> : 'Update password'}
                </Button>

                <Button
                  variant="text"
                  onClick={() => navigate('/sign-in')}
                  sx={{ textTransform: 'none' }}
                >
                  Back to sign in
                </Button>
              </Stack>
            )}
          </Stack>
        </Card>
      </Box>
    </AppTheme>
  )
}
