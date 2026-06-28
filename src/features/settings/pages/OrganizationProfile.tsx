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
  Alert,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
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
import {
  listOrganizations,
  type OrganizationListItem,
} from '../services/organizationsService'

// ---- Types ----
export type OrgRow = OrganizationListItem

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
  const [rows, setRows] = React.useState<OrgRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadOrganizations = async () => {
      setLoading(true)
      setError(null)

      try {
        const organizations = await listOrganizations()
        if (active) setRows(organizations)
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to load organizations.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadOrganizations()

    return () => {
      active = false
    }
  }, [])

  const onReset = () => {
    setSearchText('')
    setGender('all')
    setSport('all')
  }

  const onView = (row: OrgRow) => {
    navigate(`/settings/organization/${row.id}`)
  }

  const onEdit = (row: OrgRow) => {
    navigate(`/settings/organization/${row.id}/edit`)
  }

  // Derived filtering
  const filteredRows = React.useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
      const matchesGender = gender === 'all' || r.program_gender === gender
      const matchesSport = sport === 'all' || r.sport_mode === sport
      return matchesSearch && matchesGender && matchesSport
    })
  }, [rows, searchText, gender, sport])

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
        width: 210,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams<OrgRow>) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => onView(params.row)}
            >
              View
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(params.row)}
            >
              Edit
            </Button>
          </Stack>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          loading={loading}
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
