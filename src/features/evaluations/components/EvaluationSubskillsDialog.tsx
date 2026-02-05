import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Button,
} from '@mui/material'
import type { ScorecardSubskill } from '../types'

type EvaluationSubskillsDialogProps = {
  open: boolean
  categoryName?: string | null
  categoryDescription?: string | null
  skills: ScorecardSubskill[]
  ratings: Record<string, number | null>
  onRatingChange: (skillId: string, rating: number | null) => void
  onCancel: () => void
  onSave: () => void
}

const DEFAULT_RATING_OPTIONS = [1, 2, 3, 4, 5]

export default function EvaluationSubskillsDialog({
  open,
  categoryName,
  categoryDescription,
  skills,
  ratings,
  onRatingChange,
  onCancel,
  onSave,
}: EvaluationSubskillsDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        {categoryName ? `Rate subskills for ${categoryName}` : 'Rate subskills'}
      </DialogTitle>
      <DialogContent dividers>
        {categoryDescription && (
          <>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {categoryDescription}
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
          </>
        )}

        {skills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No subskills defined for this category yet.
          </Typography>
        ) : (
          <List dense>
            {skills.map((skill) => {
              const skillKey = skill.skill_id ?? skill.id

              return (
                <ListItem
                  key={skillKey}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ListItemText primary={skill.name} />
                  <ToggleButtonGroup
                    value={ratings[skillKey] ?? null}
                    exclusive
                    onChange={(_, newValue: number | null) => {
                      onRatingChange(skillKey, newValue)
                    }}
                    aria-label={`${skill.name} rating`}
                  >
                    {DEFAULT_RATING_OPTIONS.map((val) => (
                      <ToggleButton
                        key={val}
                        value={val}
                        sx={{
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          m: 0.5,
                        }}
                      >
                        {val}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
