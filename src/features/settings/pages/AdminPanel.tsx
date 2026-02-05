// src/pages/AdminPanel.tsx
import * as React from 'react'
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Chip,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom' // navigation

// ---------- Types ----------
type UserRow = {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
  role: 'coach' | 'athlete' | string
  default_org_id: string | null
  terms_accepted: boolean
  terms_accepted_at: string | null
  org_id: string | null
}

type Athlete = {
  id: string
  org_id: string
  user_id: string
  sport_id: string | null
  primary_position_id: string | null
  jersey_number: string | null
  dominant_hand: string | null
  height_cm: number | null
  weight_kg: number | null
  graduation_year: number | null
  school: string | null
  birthdate: string | null
  notes: string | null
  status: 'active' | 'inactive' | string
  created_at: string
  updated_at: string
  cell_number: string | null
}

type Coach = {
  id: string
  org_id: string
  user_id: string
  sport_id: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  title: string | null
  created_at: string
  updated_at: string
  cell_number: string | null
}

// ---------- Mock data ----------
const USERS: UserRow[] = [
  {
    id: '43e55ffd-e097-4803-87d1-43d81bd0db5b',
    full_name: 'Ryan Klipstein',
    first_name: 'Ryan',
    last_name: 'Klipstein',
    email: 'rklipstein@rutgersprep.org',
    phone: '908-328-3240',
    created_at: '2025-10-30 13:47:44.493608+00',
    updated_at: '2025-10-30 13:47:44.493608+00',
    role: 'coach',
    default_org_id: null,
    terms_accepted: true,
    terms_accepted_at: '2025-10-30 13:47:44.493608+00',
    org_id: null,
  },
  {
    id: '103b536d-9499-49ed-b823-41911ee914ff',
    full_name: 'Enmanuel Cruz',
    first_name: 'Enmanuel',
    last_name: 'Cruz',
    email: 'cruzdejesusenmanuel@gmail.com',
    phone: '809-745-6788',
    created_at: '2025-10-30 13:57:10.56954+00',
    updated_at: '2025-10-30 13:57:10.56954+00',
    role: 'athlete',
    default_org_id: null,
    terms_accepted: true,
    terms_accepted_at: '2025-10-30 13:57:10.56954+00',
    org_id: null,
  },
  {
    id: '7b7d81be-8fff-4e58-bb6b-ae6320331117',
    full_name: 'Enmanuel Cruz',
    first_name: 'Enmanuel',
    last_name: 'Cruz',
    email: 'enmanuelcruzdejesus@gmail.com',
    phone: '555-111-2222',
    created_at: '2025-11-04 01:25:48.480322+00',
    updated_at: '2025-11-04 01:25:48.480322+00',
    role: 'athlete',
    default_org_id: null,
    terms_accepted: true,
    terms_accepted_at: '2025-11-04 01:25:48.480322+00',
    org_id: null,
  },
]

const ATHLETES: Athlete[] = [
  {
    id: '7370b42c-7b52-428a-825b-59b1cf7ce050',
    org_id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    user_id: '103b536d-9499-49ed-b823-41911ee914ff',
    sport_id: null,
    primary_position_id: null,
    jersey_number: null,
    dominant_hand: null,
    height_cm: null,
    weight_kg: null,
    graduation_year: 2027,
    school: null,
    birthdate: null,
    notes: null,
    status: 'active',
    created_at: '2025-10-30 13:57:10.56954+00',
    updated_at: '2025-10-30 13:57:10.56954+00',
    cell_number: '809-745-6788',
  },
  {
    id: '69f14d63-dbd9-4d2a-847c-c5d497f58b4a',
    org_id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    user_id: '7b7d81be-8fff-4e58-bb6b-ae6320331117',
    sport_id: null,
    primary_position_id: null,
    jersey_number: null,
    dominant_hand: null,
    height_cm: null,
    weight_kg: null,
    graduation_year: 2027,
    school: null,
    birthdate: null,
    notes: null,
    status: 'active',
    created_at: '2025-11-04 01:25:48.480322+00',
    updated_at: '2025-11-04 01:25:48.480322+00',
    cell_number: '555-111-2222',
  },
]

const COACHES: Coach[] = [
  {
    id: 'd8fd5291-a3c4-4eea-94e4-60b9643ca631',
    org_id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    user_id: '43e55ffd-e097-4803-87d1-43d81bd0db5b',
    sport_id: null,
    full_name: 'Ryan Klipstein',
    email: 'rklipstein@rutgersprep.org',
    phone: null,
    title: null,
    created_at: '2025-10-30 13:47:44.493608+00',
    updated_at: '2025-10-30 13:47:44.493608+00',
    cell_number: '908-328-3240',
  },
]

// ---------- Helpers ----------
const findUser = (id: string) => USERS.find((u) => u.id === id)
const fmtName = (u?: UserRow | null) => (u ? `${u.first_name} ${u.last_name}` : '—')

// ---------- Component ----------
export default function AdminPanel() {
  const [tab, setTab] = React.useState<'athletes' | 'coaches'>('athletes')
  const [search, setSearch] = React.useState('')

  const navigate = useNavigate()

  // Navigate to Athlete detail
  const openAthlete = React.useCallback(
    (athleteId: string) => {
      const athlete = ATHLETES.find((a) => a.id === athleteId)
      const user = athlete ? findUser(athlete.user_id) : undefined
      navigate(`/admin/athletes/${athleteId}`, {
        state: athlete && user ? { athlete, user } : undefined,
      })
    },
    [navigate],
  )

  // NEW: Navigate to Coach detail
  const openCoach = React.useCallback(
    (coachId: string) => {
      const coach = COACHES.find((c) => c.id === coachId)
      const user = coach ? findUser(coach.user_id) : undefined
      navigate(`/admin/coaches/${coachId}`, {
        state: coach && user ? { coach, user } : undefined,
      })
    },
    [navigate],
  )

  // join lists
  const athleteList = React.useMemo(() => {
    return ATHLETES.map((a) => {
      const u = findUser(a.user_id)
      return {
        id: a.id,
        name: fmtName(u),
        subtitle: u?.last_name ?? '',
        phone: a.cell_number ?? u?.phone ?? '',
        graduation_year: a.graduation_year ?? undefined,
      }
    })
  }, [])

  const coachList = React.useMemo(() => {
    return COACHES.map((c) => {
      const u = findUser(c.user_id)
      return {
        id: c.id,
        name: c.full_name ?? fmtName(u),
        subtitle: u?.last_name ?? '',
        phone: c.cell_number ?? u?.phone ?? '',
        email: c.email ?? u?.email ?? '',
      }
    })
  }, [])

  const filteredAthletes = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return athleteList
    return athleteList.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.subtitle ?? '').toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        String(r.graduation_year ?? '').includes(q),
    )
  }, [athleteList, search])

  const filteredCoaches = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return coachList
    return coachList.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.subtitle ?? '').toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        (r.email ?? '').toLowerCase().includes(q),
    )
  }, [coachList, search])

  const totalAthletes = ATHLETES.length
  const totalCoaches = COACHES.length

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h3" fontWeight={800}>
          Admin Panel 🔐
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Choices · Edit Choices
        </Typography>
      </Stack>

      {/* Stat cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Coaches
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {totalCoaches}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Athletes
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {totalAthletes}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Tabs + search */}
      <Card variant="outlined">
        <CardContent sx={{ pb: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v)
              setSearch('')
            }}
            aria-label="admin tabs"
            sx={{ mb: 2 }}
          >
            <Tab
              value="athletes"
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  Athletes <Chip label={totalAthletes} size="small" />
                </Stack>
              }
            />
            <Tab
              value="coaches"
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  Coaches <Chip label={totalCoaches} size="small" />
                </Stack>
              }
            />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5, maxWidth: 420 }}
          />
        </CardContent>

        {/* List */}
        <Divider />
        <Box sx={{ px: 2, py: 0.5 }}>
          {tab === 'athletes' ? (
            <List disablePadding>
              {filteredAthletes.map((a, idx) => (
                <React.Fragment key={a.id}>
                  <ListItemButton sx={{ borderRadius: 1 }} onClick={() => openAthlete(a.id)}>
                    <ListItemAvatar>
                      <Avatar>{a.name?.charAt(0) ?? '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={a.name}
                      secondary={[a.subtitle, a.phone, a.graduation_year ? `Grad ${a.graduation_year}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    />
                    <IconButton edge="end" aria-label="open">
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItemButton>
                  {idx < filteredAthletes.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
              {filteredAthletes.length === 0 && (
                <Box sx={{ p: 2, color: 'text.secondary' }}>No athletes match “{search}”.</Box>
              )}
            </List>
          ) : (
            <List disablePadding>
              {filteredCoaches.map((c, idx) => (
                <React.Fragment key={c.id}>
                  <ListItemButton sx={{ borderRadius: 1 }} onClick={() => openCoach(c.id)}>
                    <ListItemAvatar>
                      <Avatar>{c.name?.charAt(0) ?? '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={c.name}
                      secondary={[c.subtitle, c.email, c.phone].filter(Boolean).join(' · ')}
                    />
                    <IconButton edge="end" aria-label="open">
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItemButton>
                  {idx < filteredCoaches.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
              {filteredCoaches.length === 0 && (
                <Box sx={{ p: 2, color: 'text.secondary' }}>No coaches match “{search}”.</Box>
              )}
            </List>
          )}
        </Box>
      </Card>
    </Box>
  )
}
