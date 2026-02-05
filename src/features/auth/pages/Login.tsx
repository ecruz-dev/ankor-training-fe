import * as React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  CssBaseline,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useAuth } from '../../../app/providers/AuthProvider'
import ForgotPassword from '../components/ForgotPassword'
import AppTheme from '../theme/AppTheme'
import ColorModeSelect from '../theme/ColorModeSelect'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { loading, error, signIn, isAuthenticated } = useAuth()
  const [busy, setBusy] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [localMsg, setLocalMsg] = React.useState<string | null>(null)
  const [showPw, setShowPw] = React.useState(false)
  const [forgotOpen, setForgotOpen] = React.useState(false)

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLocalMsg(null)
      setBusy(true)
      await signIn(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg = err?.message ?? 'Unable to sign in. Please try again.'
      setLocalMsg(msg)
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome Back
              </Typography>
            </Stack>

            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Log In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your details to continue to your account.
              </Typography>
            </Box>

            <Stack component="form" onSubmit={handleEmailSignIn} spacing={2.5}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
                autoComplete="current-password"
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
                        onClick={() => setShowPw((s) => !s)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot Password?
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy}
                sx={{ py: 1.5, borderRadius: 2, textTransform: 'none' }}
              >
                {busy ? 'Logging in...' : 'Log In'}
              </Button>
            </Stack>

            {(localMsg || error) && (
              <Alert severity="error">{localMsg || error}</Alert>
            )}

            <Divider>
              <Typography variant="body2" color="text.secondary">
                Or continue with
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/org-signup')}
              sx={{ textTransform: 'none' }}
            >
              Sign up your organization
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link component={RouterLink} to="/sign-up">
                Sign Up
              </Link>
            </Typography>
          </Stack>
        </Card>
      </Box>

      <ForgotPassword open={forgotOpen} handleClose={() => setForgotOpen(false)} />
    </AppTheme>
  )
}

export default Login
