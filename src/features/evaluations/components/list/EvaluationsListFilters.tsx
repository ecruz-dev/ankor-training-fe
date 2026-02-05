import { InputAdornment, Paper, Stack, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

type EvaluationsListFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
}

export default function EvaluationsListFilters({
  search,
  onSearchChange,
}: EvaluationsListFiltersProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
        <TextField
          fullWidth
          size="small"
          label="Search evaluations"
          placeholder="Search by evaluation ID, team, scorecard, status, or notes"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Paper>
  )
}
