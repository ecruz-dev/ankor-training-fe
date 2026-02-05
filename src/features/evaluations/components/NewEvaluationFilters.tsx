import * as React from 'react'
import {
  Autocomplete,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Athlete, ScorecardTemplate, TeamOption } from '../types'

type PositionOption = {
  value: string
  label: string
}

type NewEvaluationFiltersProps = {
  scorecards: ScorecardTemplate[]
  teams: TeamOption[]
  athletes: Athlete[]
  selectedScorecardId: string
  selectedTeamId: string
  selectedPosition: string
  selectedAthletes: Athlete[]
  positionOptions: PositionOption[]
  isPositionDisabled: boolean
  onScorecardChange: (scorecardId: string) => void
  onTeamChange: (teamId: string) => void
  onPositionChange: (position: string) => void
  onAthletesChange: (event: React.SyntheticEvent, value: Athlete[]) => void
}

export default function NewEvaluationFilters({
  scorecards,
  teams,
  athletes,
  selectedScorecardId,
  selectedTeamId,
  selectedPosition,
  selectedAthletes,
  positionOptions,
  isPositionDisabled,
  onScorecardChange,
  onTeamChange,
  onPositionChange,
  onAthletesChange,
}: NewEvaluationFiltersProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
        <TextField
          select
          size="small"
          label="Scorecard template"
          value={selectedScorecardId}
          onChange={(event) => onScorecardChange(event.target.value)}
          sx={{ minWidth: 260 }}
        >
          {scorecards.map((sc) => (
            <MenuItem key={sc.id} value={sc.id}>
              {sc.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Filter by team"
          value={selectedTeamId}
          onChange={(event) => onTeamChange(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All teams</MenuItem>
          {teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Filter by position"
          value={selectedPosition}
          onChange={(event) => onPositionChange(event.target.value)}
          sx={{ minWidth: 200 }}
          disabled={isPositionDisabled}
        >
          <MenuItem value="">All positions</MenuItem>
          {positionOptions.map((pos) => (
            <MenuItem key={pos.value} value={pos.value}>
              {pos.label}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          multiple
          size="small"
          options={athletes}
          getOptionLabel={(option) => option.full_name}
          value={selectedAthletes}
          onChange={onAthletesChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.full_name}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Athletes to evaluate"
              placeholder={
                selectedTeamId
                  ? 'All team athletes selected by default'
                  : 'Select athletes'
              }
            />
          )}
          sx={{ flex: 1, minWidth: 260 }}
        />
      </Stack>

      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
        Flow: 1) Pick a scorecard 2) Choose a team to auto-select its athletes
        (optional) filter by position 3) Adjust athletes 4) Fill scores in the matrix.
      </Typography>
    </Paper>
  )
}
