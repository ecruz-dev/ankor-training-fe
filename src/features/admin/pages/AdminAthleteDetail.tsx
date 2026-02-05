import * as React from 'react'
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  IconButton,
  Avatar,
  Grid,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

// ---------------- Types ----------------
type AthleteRow = {
  id: string
  org_id: string
  user_id: string
  graduation_year: number
  cell_number: string | null
  market?: string | null
  team?: string | null
  position?: string | null
  evaluations_count?: number
  avatarUrl?: string | null
}

type UserRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  parent_email?: string | null
  phone?: string | null
}

// ------------- Mock lookups (fallback if no state passed) -------------
const ATHLETES: AthleteRow[] = [
  {
    id: '7370b42c-7b52-428a-825b-59b1cf7ce050',
    org_id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    user_id: '103b536d-9499-49ed-b823-41911ee914ff',
    graduation_year: 2027,
    cell_number: '809-745-6788',
    market: '3d Garden State Coast',
    team: 'Not sure',
    position: 'Defense',
    evaluations_count: 0,
    avatarUrl: '/avatar-athlete.png',
  },
  {
    id: '69f14d63-dbd9-4d2a-847c-c5d497f58b4a',
    org_id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    user_id: '7b7d81be-8fff-4e58-bb6b-ae6320331117',
    graduation_year: 2027,
    cell_number: '555-111-2222',
    market: '3d Garden State',
    team: 'U14 Girls',
    position: 'Midfield',
    evaluations_count: 2,
    avatarUrl: '/avatar-athlete.png',
  },
]

const USERS: Record<string, UserRow> = {
  '103b536d-9499-49ed-b823-41911ee914ff': {
    id: '103b536d-9499-49ed-b823-41911ee914ff',
    first_name: 'Enmanuel',
    last_name: 'Cruz',
    email: 'cruzdejesusenmanuel@gmail.com',
    parent_email: 'parent@example.com',
    phone: '809-745-6788',
  },
  '7b7d81be-8fff-4e58-bb6b-ae6320331117': {
    id: '7b7d81be-8fff-4e58-bb6b-ae6320331117',
    first_name: 'Enmanuel',
    last_name: 'Cruz',
    email: 'enmanuelcruzdejesus@gmail.com',
    parent_email: 'parent2@example.com',
    phone: '555-111-2222',
  },
}

export default function AdminAthleteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const loc = useLocation()
  const stateAthlete = (loc.state as { athlete?: AthleteRow } | undefined)?.athlete

  // Prefer row passed via navigation state; otherwise fallback to mock lookup
  const athlete: AthleteRow | undefined =
    stateAthlete ?? ATHLETES.find((a) => a.id === id)

  const user: UserRow | undefined = athlete ? USERS[athlete.user_id] : undefined

  if (!athlete || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Athlete not found.
        </Typography>
      </Box>
    )
  }

  const fullName = `${user.first_name} ${user.last_name}`
  const gradYear = athlete.graduation_year

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero bar */}
      <Box sx={{ height: 140, bgcolor: 'primary.dark', mb: -8 }} />

      {/* Content container */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2 }}>
        {/* Header row: back + avatar + name + actions */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: -8 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ bgcolor: 'common.white', boxShadow: 1 }}
              aria-label="Back"
            >
              <ArrowBackIcon />
            </IconButton>

            <Avatar
              src={athlete.avatarUrl ?? undefined}
              alt={fullName}
              sx={{
                width: 88,
                height: 88,
                borderRadius: 2,
                boxShadow: 2,
                bgcolor: 'grey.300',
              }}
            />
            <Typography variant="h5" fontWeight={700}>
              {fullName}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => (window.location.href = `mailto:${user.email}`)}
            >
              Email
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() =>
                user.parent_email && (window.location.href = `mailto:${user.parent_email}`)
              }
            >
              Parent Email
            </Button>
          </Stack>
        </Stack>

        {/* Details card */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Details
          </Typography>

          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Market
              </Typography>
              <Typography fontWeight={600}>
                {athlete.market ?? '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Team
              </Typography>
              <Typography fontWeight={600}>
                {athlete.team ?? '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Position
              </Typography>
              <Typography fontWeight={600}>
                {athlete.position ?? '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Grad Year
              </Typography>
              <Typography fontWeight={600}>{gradYear}</Typography>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
            Number of Evaluations
          </Typography>

          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              px: 2,
              py: 1.5,
              width: { xs: '100%', sm: 320 },
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {athlete.evaluations_count ?? 0}
          </Box>
        </Paper>

        {/* Big action button */}
        <Stack alignItems="center" sx={{ mt: 3, mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<FavoriteBorderIcon />}
            sx={{ minWidth: { xs: '100%', sm: 420 }, borderRadius: 2 }}
          >
            Practice Plans
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
