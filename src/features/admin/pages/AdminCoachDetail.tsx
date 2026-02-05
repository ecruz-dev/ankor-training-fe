import * as React from 'react'
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Card,
  CardContent,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

/** Keep in sync with your AdminPanel types */
type UserRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  org_id: string | null
}

type Coach = {
  id: string
  org_id: string
  user_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  title: string | null
  created_at: string
  updated_at: string
  cell_number: string | null
}

type LocationState = {
  coach?: Coach
  user?: UserRow
}

export default function AdminCoachDetail() {
  const { coachId } = useParams<{ coachId: string }>()
  const { state } = useLocation() as { state?: LocationState }
  const navigate = useNavigate()

  const coach = state?.coach
  const user = state?.user

  // Fallback-safe fields
  const userName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  // Group the nullish coalescing before using || to satisfy Babel/TS
  const name = (coach?.full_name ?? userName) || 'Coach';

  const email = coach?.email ?? user?.email ?? '';
  const phone = coach?.cell_number ?? coach?.phone ?? user?.phone ?? '';

  // These fields are placeholders to match the UI reference
  const market = '—' // e.g., "3d Garden State"
  const team = '—'   // e.g., "2034"

  const [isSubAdmin, setIsSubAdmin] = React.useState(false)

  const handleEmailClick = () => {
    if (email) window.location.href = `mailto:${email}`
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top banner */}
      <Box sx={{ height: 120, bgcolor: 'primary.dark', mb: -7 }} />

      {/* Page header */}
      <Box sx={{ px: { xs: 2, md: 3 }, position: 'relative' }}>
        <Box sx={{ pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: 'grey.600', bgcolor: 'background.paper' }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Admin Panel / <strong>{name.split(' ')[0] || 'Coach'}</strong>
          </Typography>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1, mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 96,
                height: 96,
                borderRadius: 3,
                boxShadow: 1,
                mt: -5, // overlap banner
              }}
            >
              {name?.charAt(0) ?? '?'}
            </Avatar>
            <Stack spacing={0.5}>
              <Typography variant="h5" fontWeight={700}>
                {name}
              </Typography>
              {/* "Sub Admin" toggle row like the reference */}
              <FormControlLabel
                sx={{
                  alignItems: 'center',
                  m: 0,
                  '& .MuiFormControlLabel-label': { fontSize: 14, color: 'text.secondary' },
                }}
                control={
                  <Switch
                    checked={isSubAdmin}
                    onChange={(_, v) => setIsSubAdmin(v)}
                    size="small"
                  />
                }
                label="Sub Admin"
                labelPlacement="start"
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<EmailOutlinedIcon />}
              onClick={handleEmailClick}
              disabled={!email}
              sx={{ bgcolor: 'primary.dark' }}
            >
              Email
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Details card */}
      <Box sx={{ px: { xs: 2, md: 3 } }}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Details
            </Typography>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />}
            >
              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary">
                  Market
                </Typography>
                <Typography variant="body1">{market}</Typography>
              </Box>

              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary">
                  Team
                </Typography>
                <Typography variant="body1">{team}</Typography>
              </Box>

              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{phone || '—'}</Typography>
              </Box>

              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{email || '—'}</Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Number of Evaluations
              </Typography>
              <Card
                variant="outlined"
                sx={{ px: 2, py: 1.25, maxWidth: 380, borderStyle: 'dashed' }}
              >
                <Typography variant="h6">0</Typography>
              </Card>
            </Box>
          </CardContent>
        </Card>

        {/* Bottom primary action */}
        <Box sx={{ display: 'grid', placeItems: 'center', my: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlaceOutlinedIcon />}
            sx={{ px: 4, bgcolor: 'primary.dark' }}
          >
            Practice Plans
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
