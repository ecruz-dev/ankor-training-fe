// OrganizationProfilePage.tsx — Ankor Training App
// Data grid with Search, Filters, and CSV Export + Edit per row.
// Drop this under src/pages/ and point your route to it (e.g., /settings/organization).

import * as React from 'react'
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'

// ---- Types ----
export type OrgRow = {
  id: string
  name: string
  slug: string
  sport_mode: 'single' | 'multi'
  created_at: string
  updated_at: string
  program_gender: 'boys' | 'girls' | 'coed'
}

// ---- Mock data (replace with API hook/service call when ready) ----
const ROWS: OrgRow[] = [
  {
    id: '7498990d-aa4c-401d-92a7-67152514858a',
    name: 'ANKOR Lacrosse Club',
    slug: 'ankor-lacrosse',
    sport_mode: 'single',
    created_at: '2025-10-22 13:04:35.132919+00',
    updated_at: '2025-11-04 01:33:34.069174+00',
    program_gender: 'coed',
  },
  {
    id: '5f8d6a10-3a2b-4c1e-9a77-8c2f2b7e9a10',
    name: 'Boulder Lacrosse Club',
    slug: 'boulder-lacrosse-club',
    sport_mode: 'single',
    created_at: '2025-10-28 22:29:41.049577+00',
    updated_at: '2025-11-04 01:33:34.069174+00',
    program_gender: 'coed',
  },
  {
    id: '9a3b2c41-8d77-4f5a-9e21-1234567890ab',
    name: 'Seattle Lacrosse Club',
    slug: 'seattle-lacrosse-club',
    sport_mode: 'single',
    created_at: '2025-10-28 22:29:41.049577+00',
    updated_at: '2025-11-04 01:33:34.069174+00',
    program_gender: 'coed',
  },
  {
    id: '65c67f2c-fbd8-46e7-b026-f91cc1d37674',
    name: 'Ankor Elite Academy',
    slug: 'ankor-elite-academy',
    sport_mode: 'single',
    created_at: '2025-11-04 01:51:36.462866+00',
    updated_at: '2025-11-04 01:51:36.462866+00',
    program_gender: 'coed',
  },
  {
    id: '7a286917-279d-434b-b58a-cfffe13ac9e3',
    name: 'My Org Test',
    slug: 'my-org-test',
    sport_mode: 'single',
    created_at: '2025-11-04 13:42:08.475271+00',
    updated_at: '2025-11-04 13:42:08.475271+00',
    program_gender: 'boys',
  },
  {
    id: 'b41e7242-24c0-4d9e-95b2-a43333df82ca',
    name: 'My Org Test3',
    slug: 'my-org-test3',
    sport_mode: 'single',
    created_at: '2025-11-04 14:41:15.806601+00',
    updated_at: '2025-11-04 14:41:15.806601+00',
    program_gender: 'boys',
  },
]

// ---- Helpers ----
const fmtDate = (value: string) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

// ---- Custom Toolbar with search, filters, export ----
type OrgToolbarProps = {
  searchText: string
  setSearchText: (v: string) => void
  gender: 'all' | 'boys' | 'girls' | 'coed'
  setGender: (v: 'all' | 'boys' | 'girls' | 'coed') => void
  sport: 'all' | 'single' | 'multi'
  setSport: (v: 'all' | 'single' | 'multi') => void
  onReset: () => void
}

function OrgToolbar({ searchText, setSearchText, gender, setGender, sport, setSport, onReset }: OrgToolbarProps) {
  return (
    <GridToolbarContainer>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ p: 1, width: '100%' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <TextField
          size="small"
          placeholder="Search name or slug…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )}}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="gender-filter-label">Program Gender</InputLabel>
          <Select
            labelId="gender-filter-label"
            value={gender}
            label="Program Gender"
            onChange={(e) => setGender(e.target.value as OrgToolbarProps['gender'])}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="coed">Coed</MenuItem>
            <MenuItem value="boys">Boys</MenuItem>
            <MenuItem value="girls">Girls</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="sport-filter-label">Sport Mode</InputLabel>
          <Select
            labelId="sport-filter-label"
            value={sport}
            label="Sport Mode"
            onChange={(e) => setSport(e.target.value as OrgToolbarProps['sport'])}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="single">Single</MenuItem>
            <MenuItem value="multi">Multi</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="text"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
        >
          Reset
        </Button>

        <Box sx={{ flex: 1 }} />
        <GridToolbarDensitySelector />
        <GridToolbarExport csvOptions={{ utf8WithBom: true }} />
      </Stack>
    </GridToolbarContainer>
  )
}

export default function OrganizationProfilePage() {
  const navigate = useNavigate()

  // Local UI state for search + filters
  const [searchText, setSearchText] = React.useState('')
  const [gender, setGender] = React.useState<OrgToolbarProps['gender']>('all')
  const [sport, setSport] = React.useState<OrgToolbarProps['sport']>('all')

  const onReset = () => {
    setSearchText('')
    setGender('all')
    setSport('all')
  }

  const onEdit = (row: OrgRow) => {
    // Adjust this path to your edit route (or open a dialog instead)
    navigate(`/settings/organization/${row.id}/edit`)
  }

  // Derived filtering
  const filteredRows = React.useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return ROWS.filter((r) => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
      const matchesGender = gender === 'all' || r.program_gender === gender
      const matchesSport = sport === 'all' || r.sport_mode === sport
      return matchesSearch && matchesGender && matchesSport
    })
  }, [searchText, gender, sport])

  const columns = React.useMemo<GridColDef<OrgRow>[]>(
    () => [
      { field: 'name', headerName: 'Organization', flex: 1.4, minWidth: 200 },
      { field: 'slug', headerName: 'Slug', flex: 1, minWidth: 160 },
      {
        field: 'program_gender',
        headerName: 'Program Gender',
        width: 140,
        valueFormatter: (p) => p.value?.toString().replace(/^./, (c) => c.toUpperCase()),
      },
      { field: 'sport_mode', headerName: 'Sport Mode', width: 120 },
      {
        field: 'created_at',
        headerName: 'Created',
        minWidth: 200,
        flex: 1,
        valueFormatter: (p) => fmtDate(p.value as string),
      },
      {
        field: 'updated_at',
        headerName: 'Updated',
        minWidth: 200,
        flex: 1,
        valueFormatter: (p) => fmtDate(p.value as string),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams<OrgRow>) => (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(params.row)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Organization Profile
        </Typography>
      </Stack>

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          getRowId={(r) => r.id}
          columns={columns}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 10 } },
            sorting: { sortModel: [{ field: 'updated_at', sort: 'desc' }] },
          }}
          pageSizeOptions={[5, 10, 25]}
          slots={{ toolbar: OrgToolbar }}
          slotProps={{
            toolbar: {
              searchText,
              setSearchText,
              gender,
              setGender,
              sport,
              setSport,
              onReset,
            } as OrgToolbarProps,
          }}
        />
      </Box>
    </Box>
  )
}
