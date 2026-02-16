import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import BarChartIcon from '@mui/icons-material/BarChart'
import RepeatIcon from '@mui/icons-material/Repeat'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ShareIcon from '@mui/icons-material/Share'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useAuth } from '../../../app/providers/AuthProvider'
import {
  getLatestWorkoutDrills,
  getWorkoutSummary,
  type WorkoutDrillLevel,
} from '../../evaluations/api/evaluationsApi'

const WEEK_DAYS = [
  { day: 'Sat', date: 24, dot: false },
  { day: 'Sun', date: 25, dot: false },
  { day: 'Mon', date: 26, dot: true },
  { day: 'Tue', date: 27, dot: false, selected: true },
  { day: 'Wed', date: 28, dot: true },
  { day: 'Thu', date: 29, dot: true },
  { day: 'Fri', date: 30, dot: true },
]

export default function HomeDashboardPage() {
  const { orgId, athleteId } = useAuth()
  const [summaryLoading, setSummaryLoading] = React.useState(false)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)
  const [summary, setSummary] = React.useState({
    totalReps: 0,
    totalEvals: 0,
  })
  const [workoutLoading, setWorkoutLoading] = React.useState(false)
  const [workoutError, setWorkoutError] = React.useState<string | null>(null)
  const [workoutLevels, setWorkoutLevels] = React.useState<WorkoutDrillLevel[]>(
    [],
  )

  React.useEffect(() => {
    if (!orgId || !athleteId) return
    let active = true

    setSummaryLoading(true)
    setSummaryError(null)

    getWorkoutSummary({ orgId, athleteId, limit: 50, offset: 0 })
      .then((data) => {
        if (!active) return
        setSummary({
          totalReps: data.total_reps ?? 0,
          totalEvals: data.total_evals ?? 0,
        })
      })
      .catch((err: any) => {
        if (!active) return
        setSummaryError(err?.message || 'Failed to load session summary.')
      })
      .finally(() => {
        if (active) setSummaryLoading(false)
      })

    return () => {
      active = false
    }
  }, [orgId, athleteId])

  React.useEffect(() => {
    if (!orgId || !athleteId) return
    let active = true

    setWorkoutLoading(true)
    setWorkoutError(null)

    getLatestWorkoutDrills({ orgId, athleteId, limit: 50, offset: 0 })
      .then(({ levels }) => {
        if (!active) return
        setWorkoutLevels(levels)
      })
      .catch((err: any) => {
        if (!active) return
        setWorkoutError(err?.message || 'Failed to load workout drills.')
        setWorkoutLevels([])
      })
      .finally(() => {
        if (active) setWorkoutLoading(false)
      })

    return () => {
      active = false
    }
  }, [orgId, athleteId])

  const totalRepsValue = summaryError
    ? '-'
    : summaryLoading
    ? '...'
    : String(summary.totalReps)
  const totalEvalsValue = summaryError
    ? '-'
    : summaryLoading
    ? '...'
    : String(summary.totalEvals)

  const summaryStats = React.useMemo(
    () => [
      {
        label: 'Sets Completed',
        value: '0',
        icon: <BarChartIcon fontSize="small" />,
      },
      {
        label: 'Total Reps',
        value: totalRepsValue,
        icon: <RepeatIcon fontSize="small" />,
      },
      {
        label: 'Total Evaluations',
        value: totalEvalsValue,
        icon: <AssignmentIcon fontSize="small" />,
      },
      {
        label: 'Session Duration',
        value: 'N/A',
        icon: <AccessTimeIcon fontSize="small" />,
      },
      {
        label: 'Shared Plans',
        value: '0',
        icon: <ShareIcon fontSize="small" />,
      },
    ],
    [totalEvalsValue, totalRepsValue],
  )

  const todayLabel = React.useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const hasDrills = workoutLevels.some((level) => level.drills.length > 0)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        bgcolor: 'grey.50',
        borderRadius: 3,
        p: { xs: 2, md: 3 },
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={500}>
          Workout Entry
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Stack spacing={2.5}>
            <Stack spacing={1.5}>
            </Stack>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      January 2026
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CalendarMonthIcon />}
                      endIcon={<KeyboardArrowDownIcon />}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 999,
                      }}
                    >
                      Monthly
                    </Button>
                    <IconButton size="small">
                      <MoreHorizIcon />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconButton size="small">
                      <ChevronLeftIcon />
                    </IconButton>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: 1,
                        flexGrow: 1,
                      }}
                    >
                      {WEEK_DAYS.map((item) => (
                        <Box key={item.day} sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {item.day}
                          </Typography>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: item.selected
                                ? '1.5px solid'
                                : '1px solid transparent',
                              borderColor: item.selected
                                ? 'grey.700'
                                : 'transparent',
                              display: 'grid',
                              placeItems: 'center',
                              mx: 'auto',
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="subtitle2">
                              {item.date}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: item.dot ? 'error.main' : 'transparent',
                              mx: 'auto',
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                    <IconButton size="small">
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 4, boxShadow: 2 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="subtitle1" color="text.secondary">
                    {todayLabel}
                  </Typography>

                  {workoutLoading && (
                    <Typography variant="body2" color="text.secondary">
                      Loading today&apos;s workout...
                    </Typography>
                  )}

                  {workoutError && (
                    <Typography variant="body2" color="text.secondary">
                      Unable to load today&apos;s workout.
                    </Typography>
                  )}

                  {!workoutLoading && !workoutError && !hasDrills && (
                    <Stack spacing={2} alignItems="center" textAlign="center">
                      <Avatar
                        sx={{
                          bgcolor: 'transparent',
                          border: '2px solid',
                          borderColor: 'grey.700',
                          color: 'text.primary',
                          width: 56,
                          height: 56,
                        }}
                      >
                        <FitnessCenterIcon />
                      </Avatar>
                      <Typography variant="h5" fontWeight={500}>
                        No Workout for Today
                      </Typography>
                    </Stack>
                  )}

                  {!workoutLoading && !workoutError && hasDrills && (
                    <Stack spacing={2.5}>
                      {workoutLevels.map((level) => {
                        const levelTitle =
                          level.title || (level.level ? `Level ${level.level}` : 'Level')
                        return (
                          <Box key={`${level.level}-${level.title}`}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {levelTitle}
                              </Typography>
                              {level.targetReps !== null &&
                              level.targetReps !== undefined ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Target reps: {level.targetReps}
                                </Typography>
                              ) : null}
                            </Stack>
                            <Stack spacing={1.25} mt={1.5}>
                              {level.drills.map((drill) => (
                                <Box
                                  key={drill.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    bgcolor: 'common.white',
                                  }}
                                >
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {drill.title || 'Untitled drill'}
                                    </Typography>
                                    {drill.duration !== null &&
                                    drill.duration !== undefined ? (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Duration: {drill.duration}
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                  <FitnessCenterIcon fontSize="small" />
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )
                      })}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FitnessCenterIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Session Summary
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    {summaryStats.map((stat) => (
                      <Grid item xs={6} key={stat.label}>
                        <Paper
                          elevation={0}
                          sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {stat.label}
                            </Typography>
                            {stat.icon}
                          </Stack>
                          <Typography variant="h6" fontWeight={600} mt={1}>
                            {stat.value}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <UploadFileIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Imported Data
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    No Imported Data for this session.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmojiEventsIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      New PR&apos;s
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    No PRs for this session.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
