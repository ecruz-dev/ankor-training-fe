import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Stack,
} from '@mui/material'
import type { Athlete, PastEvaluationRow } from '../types'

type PastEvaluationsPanelProps = {
  layout: 'side' | 'stack'
  athletes: Athlete[]
  activeAthleteId: string | null
  onAthleteChange: (nextId: string | null) => void
  loading: boolean
  error: string | null
  evaluations: PastEvaluationRow[]
}

export default function PastEvaluationsPanel({
  layout,
  athletes,
  activeAthleteId,
  onAthleteChange,
  loading,
  error,
  evaluations,
}: PastEvaluationsPanelProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: layout === 'side' ? { xs: 'auto', lg: 520 } : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Past evaluations
      </Typography>

      {athletes.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5 }}
          >
            Athlete
          </Typography>
          <TextField
            select
            size="small"
            fullWidth
            value={activeAthleteId ?? ''}
            onChange={(e) => onAthleteChange(e.target.value || null)}
          >
            {athletes.map((athlete) => (
              <MenuItem key={athlete.id} value={athlete.id}>
                {athlete.full_name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select at least one athlete to see their past evaluations.
        </Typography>
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeAthleteId && (
          <>
            {loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Loading past evaluations...
              </Typography>
            )}

            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}

            {!loading && !error && evaluations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No past evaluations found for this athlete (mock data).
              </Typography>
            )}

            {!loading && !error && evaluations.length > 0 && (
              <List dense>
                {evaluations.map((ev) => (
                  <Box component="li" key={ev.id} sx={{ listStyle: 'none' }}>
                    <ListItem alignItems="flex-start" sx={{ py: 1 }} disableGutters>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {ev.scorecard_template_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(ev.evaluated_at).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <>
                            {ev.team_name && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                Team: {ev.team_name}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              Final rating: {ev.final_rating ?? 'N/A'}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
              </List>
            )}
          </>
        )}

        {!activeAthleteId && athletes.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose an athlete above to view their history.
          </Typography>
        )}
      </Box>
    </Paper>
  )
}
