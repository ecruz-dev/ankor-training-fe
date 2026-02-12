import * as React from 'react'
import {
  Box,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PastEvaluationsPanel from './PastEvaluationsPanel'
import { getRatingScale } from '../utils/getRatingScale'
import type {
  Athlete,
  PastEvaluationRow,
  ScorecardCategory,
  ScorecardSubskill,
} from '../types'

const BASELINE_RATING_OPTIONS = [1, 2, 3, 4, 5]

type NewEvaluationMobilePanelProps = {
  isReady: boolean
  selectedAthletes: Athlete[]
  activeAthleteId: string | null
  onAthleteChange: (nextId: string | null) => void
  currentCategory: ScorecardCategory | null
  activeCategoryIndex: number
  totalCategories: number
  mobileCategoryScore: number | null
  onCategoryScoreChange: (value: number | null) => void
  subskillsExpanded: boolean
  onToggleSubskills: () => void
  currentSubskills: ScorecardSubskill[] | undefined
  subskillRatings: Record<string, number | null>
  onSubskillRatingChange: (subskillId: string, rating: number | null) => void
  hasPreviousCategory: boolean
  hasNextCategory: boolean
  onPreviousCategory: () => void
  onNextCategory: () => void
  onSave: () => void
  saving: boolean
  disableSave: boolean
  showPastPanel: boolean
  pastEvaluations: PastEvaluationRow[]
  loadingPast: boolean
  pastError: string | null
}

export default function NewEvaluationMobilePanel({
  isReady,
  selectedAthletes,
  activeAthleteId,
  onAthleteChange,
  currentCategory,
  activeCategoryIndex,
  totalCategories,
  mobileCategoryScore,
  onCategoryScoreChange,
  subskillsExpanded,
  onToggleSubskills,
  currentSubskills,
  subskillRatings,
  onSubskillRatingChange,
  hasPreviousCategory,
  hasNextCategory,
  onPreviousCategory,
  onNextCategory,
  onSave,
  saving,
  disableSave,
  showPastPanel,
  pastEvaluations,
  loadingPast,
  pastError,
}: NewEvaluationMobilePanelProps) {
  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Mobile evaluations
        </Typography>

        {!isReady ? (
          <Typography variant="body2" color="text.secondary">
            Select a scorecard, team, and athletes to start rating subskills.
          </Typography>
        ) : (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'stretch', overflowX: 'auto', pb: 1 }}>
            <Box sx={{ minWidth: 180, flexShrink: 0 }}>
              <Typography variant="subtitle2" gutterBottom>
                Athletes
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 440, overflow: 'auto' }}>
                <List dense disablePadding>
                  {selectedAthletes.map((athlete) => (
                    <ListItemButton
                      key={athlete.id}
                      selected={athlete.id === activeAthleteId}
                      onClick={() => onAthleteChange(athlete.id)}
                    >
                      <ListItemText
                        primary={athlete.full_name}
                        secondary={athlete.position ? athlete.position : undefined}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {currentCategory ? (
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                      Category {activeCategoryIndex + 1} of {totalCategories}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {currentCategory.name}
                    </Typography>
                    {currentCategory.description && (
                      <Typography variant="body2" color="text.secondary">
                        {currentCategory.description}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      Category rating (baseline)
                    </Typography>

                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={mobileCategoryScore}
                      onChange={(_, newValue: number | null) => onCategoryScoreChange(newValue)}
                      aria-label="Category rating baseline"
                      disabled={!activeAthleteId}
                    >
                      {BASELINE_RATING_OPTIONS.map((val) => (
                        <ToggleButton
                          key={val}
                          value={val}
                          sx={{ borderRadius: '50%', width: 36, height: 36, m: 0.5 }}
                        >
                          {val}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onToggleSubskills}
                    endIcon={subskillsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    disabled={!currentCategory}
                  >
                    {subskillsExpanded ? 'Hide subskills' : 'Show subskills'}
                  </Button>

                  <Collapse in={subskillsExpanded} timeout="auto" unmountOnExit>
                    {currentSubskills === undefined ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading subskills for this category...
                      </Typography>
                    ) : currentSubskills.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No subskills defined for this category yet.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5} sx={{ mt: 1 }}>
                        {currentSubskills
                          .slice()
                          .sort((a, b) => a.position - b.position)
                          .map((skill) => {
                            const subskillId = skill.skill_id ?? skill.id
                            const subskillKey = `${currentCategory.id}-${subskillId}`
                            const ratingScale = getRatingScale(
                              skill.rating_min,
                              skill.rating_max,
                            )
                            const baselineRating = mobileCategoryScore ?? null
                            const useBaseline =
                              baselineRating !== null &&
                              ratingScale.includes(baselineRating)
                            const ratingValue =
                              subskillRatings[subskillId] ??
                              subskillRatings[skill.id] ??
                              (useBaseline ? baselineRating : null)

                            return (
                              <Paper key={subskillKey} variant="outlined" sx={{ p: 1.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {skill.name}
                                </Typography>
                                {skill.description && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mb: 0.5 }}
                                  >
                                    {skill.description}
                                  </Typography>
                                )}
                                <ToggleButtonGroup
                                  size="small"
                                  exclusive
                                  value={ratingValue}
                                  onChange={(_, newValue: number | null) =>
                                    onSubskillRatingChange(subskillId, newValue)
                                  }
                                  aria-label={`${skill.name} rating`}
                                  disabled={!activeAthleteId}
                                >
                                  {ratingScale.map((val) => (
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
                              </Paper>
                            )
                          })}
                      </Stack>
                    )}
                  </Collapse>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: 'auto',
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ChevronLeftIcon />}
                      disabled={!hasPreviousCategory}
                      onClick={onPreviousCategory}
                    >
                      Previous
                    </Button>
                    {hasNextCategory ? (
                      <Button
                        variant="contained"
                        endIcon={<ChevronRightIcon />}
                        onClick={onNextCategory}
                        disabled={!activeAthleteId}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={onSave}
                        disabled={saving || disableSave}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a scorecard to load categories.
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </Paper>

      {showPastPanel && (
        <PastEvaluationsPanel
          layout="stack"
          athletes={selectedAthletes}
          activeAthleteId={activeAthleteId}
          onAthleteChange={onAthleteChange}
          loading={loadingPast}
          error={pastError}
          evaluations={pastEvaluations}
        />
      )}
    </Stack>
  )
}
