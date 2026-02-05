// src/pages/AthletesEvaluationReportPage.tsx

import * as React from 'react'
import {
  Box,
  Stack,
  Typography,
  Paper,
  TextField,
  MenuItem,
  List,
  ListItemButton,
  IconButton,
  Divider,
  Chip,
  InputAdornment,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  DataGrid,
  type GridColDef,
} from '@mui/x-data-grid'

// ---- Local types ----
type AthleteEvaluationReportRow = {
  id: string
  athlete_name: string
  team_name?: string | null
  scorecard_template_name: string
  final_rating: number | null
  evaluated_at: string // ISO string
}

type TeamOption = {
  id: string
  name: string
}

type ScorecardOption = {
  id: string
  name: string
}

// ---- Mock data (you can tweak these as needed) ----
const MOCK_ROWS: AthleteEvaluationReportRow[] = [
  {
    id: '1',
    athlete_name: 'Enm Cruz',
    team_name: 'Blue Hawks',
    scorecard_template_name: 'Advanced Offensive Scorecard',
    final_rating: 4.5,
    evaluated_at: '2025-12-02T10:14:00Z',
  },
  {
    id: '2',
    athlete_name: 'Brock Lesnar',
    team_name: 'Blue Hawks',
    scorecard_template_name: 'Advanced Offensive Scorecard',
    final_rating: 4.2,
    evaluated_at: '2025-11-17T10:03:00Z',
  },
  {
    id: '3',
    athlete_name: 'Brock Lesnar',
    team_name: 'Blue Hawks',
    scorecard_template_name: 'Advanced Offensive Scorecard',
    final_rating: 4.0,
    evaluated_at: '2025-11-08T12:35:00Z',
  },
  {
    id: '4',
    athlete_name: 'Aiden Betsch',
    team_name: 'Red Lions',
    scorecard_template_name: 'Advanced Offensive Scorecard',
    final_rating: 3.9,
    evaluated_at: '2025-10-28T13:24:00Z',
  },
  {
    id: '5',
    athlete_name: 'Enm Cruz',
    team_name: 'Red Lions',
    scorecard_template_name: 'Advanced Offensive Scorecard',
    final_rating: 4.8,
    evaluated_at: '2025-10-21T10:12:00Z',
  },
]

// Build select options from mock data
const TEAM_OPTIONS: TeamOption[] = Array.from(
  new Set(MOCK_ROWS.map((r) => r.team_name).filter(Boolean)),
).map((name) => ({
  id: name as string,
  name: name as string,
}))

const SCORECARD_OPTIONS: ScorecardOption[] = Array.from(
  new Set(MOCK_ROWS.map((r) => r.scorecard_template_name)),
).map((name) => ({
  id: name,
  name,
}))

export default function AthletesEvaluationReportPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [selectedTeam, setSelectedTeam] = React.useState<string>('')
  const [selectedScorecard, setSelectedScorecard] = React.useState<string>('')
  const [search, setSearch] = React.useState('')

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    // Example: DECEMBER 2, 2025 AT 10:14 AM
    return d
      .toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
      .toUpperCase()
  }

  const formatRating = (value?: number | null) => {
    if (value == null) return '—'
    return value.toFixed(1)
  }

  const filteredRows = React.useMemo(() => {
    const term = search.trim().toLowerCase()

    return MOCK_ROWS.filter((row) => {
      if (selectedTeam && row.team_name !== selectedTeam) return false
      if (
        selectedScorecard &&
        row.scorecard_template_name !== selectedScorecard
      )
        return false

      if (!term) return true

      const haystack = `${row.athlete_name} ${
        row.scorecard_template_name
      } ${row.team_name ?? ''}`.toLowerCase()

      return haystack.includes(term)
    })
  }, [search, selectedTeam, selectedScorecard])

const columns = React.useMemo<GridColDef<AthleteEvaluationReportRow>[]>(
  () => [
    {
      field: 'athlete_name',
      headerName: 'Athlete',
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: 'team_name',
      headerName: 'Team',
      flex: 1,
      minWidth: 130,
      // value is the raw field value, row is the full row object
      valueGetter: (_value, row) => row.team_name ?? '—',
    },
    {
      field: 'scorecard_template_name',
      headerName: 'Scorecard',
      flex: 1.3,
      minWidth: 180,
    },
    {
      field: 'final_rating',
      headerName: 'Final Rating',
      type: 'number',
      minWidth: 120,
      flex: 0.6,
      // first arg is the value
      valueFormatter: (value) => {
        const v = value as number | null
        if (v == null) return '—'
        return v.toFixed(1)
      },
    },
    {
      field: 'evaluated_at',
      headerName: 'Evaluated At',
      minWidth: 220,
      flex: 1,
      valueFormatter: (value) => {
        if (!value) return '—'
        const d = new Date(value as string)
        return d.toLocaleString()
      },
    },
  ],
  [],
)

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={700}>
          Past Evaluations
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Review your previously submitted evaluations. Tap any row to view full
          details.
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2 }}>
          <Stack
            spacing={2}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              select
              size="small"
              label="Team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              fullWidth
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              <MenuItem value="">All teams</MenuItem>
              {TEAM_OPTIONS.map((team) => (
                <MenuItem key={team.id} value={team.name}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Scorecard"
              value={selectedScorecard}
              onChange={(e) => setSelectedScorecard(e.target.value)}
              fullWidth
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            >
              <MenuItem value="">All scorecards</MenuItem>
              {SCORECARD_OPTIONS.map((sc) => (
                <MenuItem key={sc.id} value={sc.name}>
                  {sc.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {/* Search + List/Grid */}
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />
          </Box>

          <Divider />

          {filteredRows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No evaluations found for the selected filters.
              </Typography>
            </Box>
          ) : isMobile ? (
            // 🔹 Mobile: list layout (like the mock)
            <List sx={{ p: 0 }}>
              {filteredRows.map((row) => (
                <React.Fragment key={row.id}>
                  <ListItemButton
                    alignItems="flex-start"
                    sx={{ py: 1.5 }}
                    // onClick={() => handleOpenDetails(row)} // hook this up later
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: 'primary.main',
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        {formatDate(row.evaluated_at)}
                      </Typography>

                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ lineHeight: 1.3 }}
                      >
                        {row.athlete_name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.3 }}
                      >
                        {row.scorecard_template_name}
                      </Typography>

                      {row.team_name && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.25 }}
                        >
                          Team: {row.team_name}
                        </Typography>
                      )}
                    </Box>

                    <Stack spacing={1} alignItems="flex-end" sx={{ pl: 1 }}>
                      <Chip
                        size="small"
                        label={formatRating(row.final_rating)}
                        sx={{ fontWeight: 600 }}
                      />
                      <IconButton size="small" edge="end">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            // 🔹 Desktop / tablet: grid layout
            <Box sx={{ height: 560, p: 2 }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                pageSizeOptions={[25, 50, 100]}
                density="compact"
                initialState={{
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                }}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>
          )}
        </Paper>
      </Stack>
    </Box>
  )
}
