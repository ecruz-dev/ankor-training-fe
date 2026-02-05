import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { EvaluationListRow } from '../../api/evaluationsApi'
import { formatDateTime } from '../../utils/formatDateTime'
import { getEvaluationStatusUi } from '../../utils/evaluationStatus'

type EvaluationsListMobileProps = {
  rows: EvaluationListRow[]
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
}

export default function EvaluationsListMobile({
  rows,
  loading,
  onView,
  onEdit,
}: EvaluationsListMobileProps) {
  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {loading ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No evaluations found.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {rows.map((row, idx) => {
            const created = formatDateTime(row.created_at)
            const statusUi = getEvaluationStatusUi((row as any).status ?? null)

            return (
              <Box key={row.id}>
                <ListItemButton
                  alignItems="flex-start"
                  onClick={() => onView(row.id)}
                  sx={{ py: 1.5 }}
                >
                  <Stack spacing={1} sx={{ width: '100%' }}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {row.team_name || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {created || '-'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation()
                            onView(row.id)
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEdit(row.id)
                          }}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={row.scorecard_template_name || 'No scorecard'}
                        sx={{ maxWidth: '100%' }}
                      />
                      <Chip size="small" label={statusUi.label} color={statusUi.color} />
                    </Stack>

                    {row.notes ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {row.notes}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No notes
                      </Typography>
                    )}

                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace' }}
                      color="text.secondary"
                    >
                      {row.id}
                    </Typography>
                  </Stack>
                </ListItemButton>

                {idx < rows.length - 1 && <Divider />}
              </Box>
            )
          })}
        </List>
      )}
    </Paper>
  )
}
