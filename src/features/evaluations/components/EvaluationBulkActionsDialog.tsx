import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import type { Athlete, ScorecardCategory } from '../types'

type EvaluationBulkActionsDialogProps = {
  open: boolean
  categories: ScorecardCategory[]
  selectedCategoryIds: string[]
  onCategoryIdsChange: (next: string[]) => void
  bulkValue: number | ''
  onBulkValueChange: (next: number | '') => void
  athletes: Athlete[]
  selectedAthleteIds: string[]
  onToggleAthlete: (athleteId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  onCancel: () => void
  onApply: () => void
}

export default function EvaluationBulkActionsDialog({
  open,
  categories,
  selectedCategoryIds,
  onCategoryIdsChange,
  bulkValue,
  onBulkValueChange,
  athletes,
  selectedAthleteIds,
  onToggleAthlete,
  onSelectAll,
  onClearAll,
  onCancel,
  onApply,
}: EvaluationBulkActionsDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Bulk actions</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Categories
            </Typography>
            <Autocomplete
              multiple
              size="small"
              options={categories}
              getOptionLabel={(option) => option.name}
              value={categories.filter((cat) => selectedCategoryIds.includes(cat.id))}
              onChange={(_, newValue) => {
                onCategoryIdsChange(newValue.map((cat) => cat.id))
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select categories"
                  placeholder="Choose one or more"
                />
              )}
            />
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 180 } }}>
            <Typography variant="subtitle2" gutterBottom>
              Evaluation
            </Typography>
            <TextField
              label="Bulk grade"
              type="number"
              size="small"
              fullWidth
              value={bulkValue}
              onChange={(e) => {
                const val = e.target.value
                onBulkValueChange(val === '' ? '' : Number(val))
              }}
              inputProps={{ min: 1, max: 5 }}
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Apply to athletes
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button size="small" onClick={onSelectAll}>
              Select all
            </Button>
            <Button size="small" onClick={onClearAll}>
              Clear all
            </Button>
          </Box>

          <List
            dense
            sx={{
              maxHeight: 260,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {athletes.map((athlete) => {
              const checked = selectedAthleteIds.includes(athlete.id)
              return (
                <ListItem
                  key={athlete.id}
                  button
                  onClick={() => onToggleAthlete(athlete.id)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary={athlete.full_name} />
                </ListItem>
              )
            })}
            {athletes.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No athletes available. Pick a team and athletes first.
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onApply}
          variant="contained"
          disabled={
            bulkValue === '' ||
            selectedAthleteIds.length === 0 ||
            selectedCategoryIds.length === 0
          }
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  )
}
