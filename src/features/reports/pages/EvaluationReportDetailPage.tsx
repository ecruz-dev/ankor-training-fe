import * as React from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  listEvaluationImprovementSkills,
  listEvaluationSkillVideos,
  listEvaluationSubskillRatings,
  listEvaluationWorkoutProgress,
  listEvaluationWorkoutDrills,
  updateEvaluationWorkoutProgress,
  type EvaluationWorkoutDrillLevel,
  type EvaluationWorkoutProgressRow,
  listLatestEvaluationsByEvaluation,
  type LatestEvaluationRow,
} from '../../evaluations/api/evaluationsApi'
import DrillsPlayDialog from '../../drills/components/list/DrillsPlayDialog'
import { getDrillMediaPlay } from '../../drills/services/drillsService'
import { useAuth } from '../../../app/providers/AuthProvider'
import { type EvaluationReport, type ReportVideo } from '../data/mockEvaluationReports'
import { formatEvaluationReportDate } from '../utils/formatEvaluationReportDate'

const TOOLTIP_COPY =
  'Click the counter above each time you complete this workout. At 10 completed you will unlock your Level2 workout.'

const MEDIA_HEIGHT = 160

function buildReportFromLatestRow(
  row: LatestEvaluationRow,
  evaluationId: string,
): EvaluationReport {
  return {
    id: row.evaluation_id || evaluationId,
    evaluationId: row.evaluation_id || evaluationId,
    athleteName:
      row.athlete_full_name || row.athletes_name || 'Unknown athlete',
    evaluatorName: row.coach_name || 'Unknown coach',
    scorecardTemplate: row.scorecard_name || 'Scorecard',
    evaluatedAt: row.date,
    focusAreas: [],
    skills: [],
    skillVideos: [],
    workouts: [],
    dataByCategory: [],
  }
}

function mapWorkoutDrills(rows: EvaluationWorkoutDrillLevel[]) {
  return rows
    .map((levelItem, index) => {
      const levelRaw = levelItem.level
      const levelValue =
        typeof levelRaw === 'number'
          ? levelRaw
          : typeof levelRaw === 'string'
          ? Number(levelRaw)
          : Number.NaN
      const level = Number.isFinite(levelValue) ? levelValue : index + 1
      const targetRepsRaw = levelItem.targetReps
      const targetRepsValue =
        typeof targetRepsRaw === 'number'
          ? targetRepsRaw
          : typeof targetRepsRaw === 'string'
          ? Number(targetRepsRaw)
          : Number.NaN
      const targetReps = Number.isFinite(targetRepsValue) ? targetRepsValue : 0
      const drills = Array.isArray(levelItem.drills)
        ? levelItem.drills.map((drill, drillIndex) => {
            const durationRaw = drill.duration
            const duration =
              typeof durationRaw === 'string'
                ? durationRaw
                : typeof durationRaw === 'number'
                ? String(durationRaw)
                : ''
            return {
              id: drill.id || `drill-${level}-${drillIndex}`,
              title: drill.title || 'Drill',
              duration,
              thumbnailUrl: drill.thumbnailUrl ?? null,
              tag: null,
            }
          })
        : []

      return {
        id: `workout-${level}`,
        level,
        title: levelItem.title || `Level ${level}`,
        targetReps,
        drills,
      }
    })
    .sort((a, b) => a.level - b.level)
}

export default function EvaluationReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { orgId, athleteId, loading: authLoading } = useAuth()
  const athleteIdParam = searchParams.get('athleteId')
  const returnTo = searchParams.get('returnTo') ?? ''
  const resolvedAthleteId = athleteId ?? athleteIdParam
  const backPath =
    returnTo === 'coach'
      ? '/reports/coach-evaluation-reports'
      : '/reports/evaluation-reports'
  const [tabIndex, setTabIndex] = React.useState(0)
  const [activeLevelIndex, setActiveLevelIndex] = React.useState(0)
  const [repCount, setRepCount] = React.useState(0)
  const [workoutProgress, setWorkoutProgress] =
    React.useState<EvaluationWorkoutProgressRow | null>(null)
  const [report, setReport] = React.useState<EvaluationReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [drillPlayState, setDrillPlayState] = React.useState<{
    open: boolean
    drill: ReportVideo | null
    url: string | null
    loading: boolean
    error: string | null
  }>({
    open: false,
    drill: null,
    url: null,
    loading: false,
    error: null,
  })
  const drillPlayRequestIdRef = React.useRef(0)

  const loadReport = React.useCallback(async () => {
    if (!id) {
      setReport(null)
      setWorkoutProgress(null)
      setError('Missing evaluation id.')
      setLoading(false)
      return
    }

    if (!orgId) {
      setReport(null)
      setWorkoutProgress(null)
      setError('Missing org_id for this account.')
      setLoading(false)
      return
    }

    if (!resolvedAthleteId) {
      setReport(null)
      setWorkoutProgress(null)
      setError('Missing athlete id for this report.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [
        { rows },
        { rows: improvementRows },
        { rows: skillVideoRows },
        { rows: subskillRatingsRows },
        { rows: workoutProgressRows },
        { rows: workoutDrillsRows },
      ] = await Promise.all([
          listLatestEvaluationsByEvaluation({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
          listEvaluationImprovementSkills({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
          listEvaluationSkillVideos({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
          listEvaluationSubskillRatings({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
          listEvaluationWorkoutProgress({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
          listEvaluationWorkoutDrills({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          }),
        ])
      const row = rows[0]

      if (!row) {
        setReport(null)
        setWorkoutProgress(null)
        setError('Report not found')
        return
      }

      const workoutProgressRow = workoutProgressRows[0] ?? null

      const focusAreas = improvementRows.map((item, index) => {
        const rating =
          typeof item.rating === 'number' ? item.rating : Number(item.rating)
        const score = Number.isFinite(rating) ? rating : 0

        return {
          id:
            item.skill_id ||
            item.skill_name ||
            item.evaluation_id ||
            `focus-${index}`,
          name: item.skill_name || 'Unknown skill',
          score,
        }
      })

      const skillVideos = skillVideoRows.map((item, index) => {
        const title =
          typeof item.title === 'string' && item.title.trim()
            ? item.title.trim()
            : 'Skill video'
        const objectPath =
          typeof item.object_path === 'string' ? item.object_path.trim() : ''
        const thumbnailUrl = objectPath.startsWith('http')
          ? objectPath
          : null
        const rating =
          typeof item.rating === 'number' ? item.rating : Number(item.rating)
        const tag = Number.isFinite(rating) ? `Rating ${rating}` : null

        return {
          id:
            item.skill_id ||
            item.object_path ||
            item.evaluation_id ||
            `skill-video-${index}`,
          title,
          duration: '',
          thumbnailUrl,
          tag,
        }
      })

      const dataByCategory = subskillRatingsRows.map((category, index) => {
        const categoryId = category.id || `category-${index}`
        const name = category.name || 'Category'
        const rawSubskills = Array.isArray(category.subskills)
          ? category.subskills
          : []
        const subskills = rawSubskills.map((subskill, subIndex) => {
          const score =
            typeof subskill.score === 'number'
              ? subskill.score
              : Number(subskill.score)
          return {
            id: subskill.id || `${categoryId}-sub-${subIndex}`,
            name: subskill.name || 'Subskill',
            score: Number.isFinite(score) ? score : 0,
          }
        })

        return { id: categoryId, name, subskills }
      })

      const workouts = mapWorkoutDrills(workoutDrillsRows)

      setReport({
        ...buildReportFromLatestRow(row, id),
        focusAreas,
        skillVideos,
        workouts,
        dataByCategory,
      })
      setWorkoutProgress(workoutProgressRow)
    } catch (err) {
      console.error('Failed to load evaluation report', err)
      setReport(null)
      setWorkoutProgress(null)
      setError('Failed to load evaluation report')
    } finally {
      setLoading(false)
    }
  }, [id, orgId, resolvedAthleteId])

  React.useEffect(() => {
    if (authLoading) return
    void loadReport()
  }, [authLoading, loadReport])

  React.useEffect(() => {
    if (!report?.id) return

    const workoutsLength = report?.workouts?.length ?? 0
    const levelRaw = workoutProgress?.level
    const progressRaw = workoutProgress?.progress
    const levelValue =
      typeof levelRaw === 'number'
        ? levelRaw
        : typeof levelRaw === 'string'
        ? Number(levelRaw)
        : Number.NaN
    const progressValue =
      typeof progressRaw === 'number'
        ? progressRaw
        : typeof progressRaw === 'string'
        ? Number(progressRaw)
        : Number.NaN
    const hasLevel = Number.isFinite(levelValue)
    const hasProgress = Number.isFinite(progressValue)

    if (hasLevel || hasProgress) {
      const nextLevel = hasLevel ? Math.max(0, levelValue - 1) : 0
      const nextProgress = hasProgress ? Math.max(0, progressValue) : 0
      const clampedLevel = Math.min(
        Math.max(nextLevel, 0),
        Math.max(workoutsLength - 1, 0),
      )
      setActiveLevelIndex(clampedLevel)
      setRepCount(nextProgress)
      return
    }

    setActiveLevelIndex(0)
    setRepCount(0)
  }, [
    report?.id,
    report?.workouts?.length,
    workoutProgress?.level,
    workoutProgress?.progress,
  ])

  const workouts = report?.workouts ?? []
  const activeWorkout = workouts[activeLevelIndex] ?? null
  const isLastLevel =
    !activeWorkout || activeLevelIndex >= workouts.length - 1
  const maxRepsRaw = workoutProgress?.maxWorkoutReps
  const maxRepsValue =
    typeof maxRepsRaw === 'number'
      ? maxRepsRaw
      : typeof maxRepsRaw === 'string'
      ? Number(maxRepsRaw)
      : Number.NaN
  const workoutTargetReps = Number.isFinite(maxRepsValue)
    ? maxRepsValue
    : activeWorkout?.targetReps ?? 0
  const isLoading = loading || authLoading

  const handleRepCount = () => {
    if (!activeWorkout) return
    if (!Number.isFinite(workoutTargetReps) || workoutTargetReps <= 0) return

    const nextCount = Math.min(repCount + 1, workoutTargetReps)
    let nextLevelIndex = activeLevelIndex
    let nextProgress = nextCount
    const shouldRefreshWorkouts =
      nextCount >= workoutTargetReps && repCount < workoutTargetReps

    if (nextCount >= workoutTargetReps && !isLastLevel) {
      nextLevelIndex = activeLevelIndex + 1
      nextProgress = 0
    }

    setRepCount(nextProgress)
    if (nextLevelIndex !== activeLevelIndex) {
      setActiveLevelIndex(nextLevelIndex)
    }

    const nextLevel = nextLevelIndex + 1
    setWorkoutProgress((prev) =>
      prev
        ? {
            ...prev,
            progress: nextProgress,
            level: nextLevel,
            maxWorkoutReps: workoutTargetReps,
          }
        : prev,
    )

    if (orgId && resolvedAthleteId && id) {
      void updateEvaluationWorkoutProgress({
        orgId,
        athleteId: resolvedAthleteId,
        evaluationId: id,
        limit: 200,
        offset: 0,
      })
        .then((updated) => {
          if (updated) {
            setWorkoutProgress(updated)
          }
          if (!shouldRefreshWorkouts) return
          return listEvaluationWorkoutDrills({
            orgId,
            athleteId: resolvedAthleteId,
            evaluationId: id,
            limit: 200,
            offset: 0,
          })
            .then(({ rows: workoutRows }) => {
              const nextWorkouts = mapWorkoutDrills(workoutRows)
              setReport((prev) =>
                prev ? { ...prev, workouts: nextWorkouts } : prev,
              )
            })
            .catch((err) => {
              console.error('Failed to refresh workout drills', err)
            })
        })
        .catch((err) => {
          console.error('Failed to update workout progress', err)
        })
    }
  }

  const openDrillPlay = React.useCallback(
    (drill: ReportVideo) => {
      const resolvedOrgId = orgId?.trim()
      if (!resolvedOrgId) {
        setDrillPlayState({
          open: true,
          drill,
          url: null,
          loading: false,
          error: 'Missing org_id for this account.',
        })
        return
      }
      if (!drill.id) {
        setDrillPlayState({
          open: true,
          drill,
          url: null,
          loading: false,
          error: 'Missing drill id.',
        })
        return
      }

      setDrillPlayState({
        open: true,
        drill,
        url: null,
        loading: true,
        error: null,
      })

      const requestId = ++drillPlayRequestIdRef.current
      void (async () => {
        try {
          const response = await getDrillMediaPlay(drill.id, { orgId: resolvedOrgId })
          if (drillPlayRequestIdRef.current !== requestId) return
          setDrillPlayState((prev) => ({
            ...prev,
            url: response.play_url,
            loading: false,
          }))
        } catch (err) {
          if (drillPlayRequestIdRef.current !== requestId) return
          setDrillPlayState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to load drill video.',
            loading: false,
          }))
        }
      })()
    },
    [orgId],
  )

  const closeDrillPlay = React.useCallback(() => {
    drillPlayRequestIdRef.current += 1
    setDrillPlayState({
      open: false,
      drill: null,
      url: null,
      loading: false,
      error: null,
    })
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Loading evaluation report...
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(backPath)}
          >
            Back to reports
          </Button>
        </Stack>
      </Box>
    )
  }

  if (!report) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" color={error ? 'error' : undefined}>
            {error ?? 'Report not found'}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {error ? (
              <Button size="small" variant="outlined" onClick={loadReport}>
                Retry
              </Button>
            ) : null}
            <Button
              variant="text"
              onClick={() => navigate(backPath)}
            >
              Back to reports
            </Button>
          </Stack>
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {report.scorecardTemplate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatEvaluationReportDate(report.evaluatedAt)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={() =>
                navigate(`/evaluations/${report.evaluationId}`)
              }
            >
              See full evaluation
            </Button>
            <Button
              variant="text"
              onClick={() => navigate(backPath)}
            >
              Back to reports
            </Button>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <LabelValue label="Name" value={report.athleteName} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <LabelValue
                label="Date"
                value={formatEvaluationReportDate(report.evaluatedAt)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <LabelValue label="Evaluator" value={report.evaluatorName} />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined">
          <Tabs
            value={tabIndex}
            onChange={(_, value) => setTabIndex(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Skills" />
            <Tab label="Workouts" />
            <Tab label="Data" />
          </Tabs>
          <Divider />
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tabIndex === 0 && <SkillsTab report={report} />}
            {tabIndex === 1 && (
              <WorkoutsTab
                report={report}
                activeWorkout={activeWorkout}
                activeLevelIndex={activeLevelIndex}
                repCount={repCount}
                targetReps={workoutTargetReps}
                onRepCount={handleRepCount}
                isLastLevel={isLastLevel}
                onPlayDrill={openDrillPlay}
              />
            )}
            {tabIndex === 2 && <DataTab report={report} />}
          </Box>
        </Paper>
      </Stack>

      <DrillsPlayDialog
        open={drillPlayState.open}
        drillName={drillPlayState.drill?.title ?? null}
        loading={drillPlayState.loading}
        error={drillPlayState.error}
        playUrl={drillPlayState.url}
        onClose={closeDrillPlay}
      />
    </Box>
  )
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  )
}

function SkillsTab({ report }: { report: EvaluationReport }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Areas of Focus/Improvement (0-5)
        </Typography>
        <Grid container spacing={2}>
          {report.focusAreas.map((area) => (
            <Grid item xs={12} sm={6} md={4} key={area.id}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={600}>{area.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={(area.score / 5) * 100}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {area.score.toFixed(1)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Skills
        </Typography>
        <Grid container spacing={2}>
          {report.skills.map((skill) => (
            <Grid item xs={12} sm={6} md={4} key={skill.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={skill.category} />
                    <Chip
                      size="small"
                      color="primary"
                      label={`Score ${skill.score.toFixed(1)}`}
                    />
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {skill.name}
                  </Typography>
                  {skill.notes ? (
                    <Typography variant="body2" color="text.secondary">
                      {skill.notes}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Skill videos
        </Typography>
        <ReportVideoGallery
          videos={report.skillVideos}
          emptyLabel="No skill videos yet."
        />
      </Box>
    </Stack>
  )
}

function WorkoutsTab({
  report,
  activeWorkout,
  activeLevelIndex,
  repCount,
  targetReps,
  onRepCount,
  isLastLevel,
  onPlayDrill,
}: {
  report: EvaluationReport
  activeWorkout: EvaluationReport['workouts'][number] | null
  activeLevelIndex: number
  repCount: number
  targetReps: number
  onRepCount: () => void
  isLastLevel: boolean
  onPlayDrill: (drill: ReportVideo) => void
}) {
  if (!activeWorkout) {
    return (
      <Typography variant="body2" color="text.secondary">
        No workouts available for this report.
      </Typography>
    )
  }

  const progressLabel = targetReps
    ? `${repCount}/${targetReps} reps`
    : `${repCount} reps`
  const progressValue = targetReps ? (repCount / targetReps) * 100 : 0

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {activeWorkout.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Level {activeWorkout.level} of {report.workouts.length}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={TOOLTIP_COPY}>
              <Button variant="contained" size="small" onClick={onRepCount}>
                {progressLabel}
              </Button>
            </Tooltip>
            <Typography variant="body2" color="text.secondary">
              {isLastLevel && repCount >= targetReps
                ? 'All levels completed.'
                : `Complete ${targetReps} reps to unlock the next level.`}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Stack>
      </Paper>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Drill videos
        </Typography>
        <ReportVideoGallery
          videos={activeWorkout.drills.slice(0, 3)}
          emptyLabel="No drills available for this level."
          onVideoClick={onPlayDrill}
        />
      </Box>
    </Stack>
  )
}

function DataTab({ report }: { report: EvaluationReport }) {
  return (
    <Stack spacing={2}>
      {report.dataByCategory.map((category) => (
        <Paper key={category.id} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {category.name}
          </Typography>
          <Stack spacing={1}>
            {category.subskills.map((subskill) => (
              <Stack
                key={subskill.id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">{subskill.name}</Typography>
                <Chip
                  size="small"
                  label={subskill.score.toFixed(1)}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}

function ReportVideoGallery({
  videos,
  emptyLabel,
  onVideoClick,
}: {
  videos: ReportVideo[]
  emptyLabel: string
  onVideoClick?: (video: ReportVideo) => void
}) {
  if (videos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {videos.map((video) => (
        <Card
          key={video.id}
          variant="outlined"
          onClick={onVideoClick ? () => onVideoClick(video) : undefined}
          onKeyDown={
            onVideoClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onVideoClick(video)
                  }
                }
              : undefined
          }
          role={onVideoClick ? 'button' : undefined}
          tabIndex={onVideoClick ? 0 : undefined}
          sx={{ cursor: onVideoClick ? 'pointer' : 'default' }}
        >
          <Box
            sx={{
              position: 'relative',
              height: MEDIA_HEIGHT,
              width: '100%',
              overflow: 'hidden',
              bgcolor: 'grey.900',
            }}
          >
            {video.thumbnailUrl ? (
              <Box
                component="img"
                src={video.thumbnailUrl}
                alt={video.title}
                loading="lazy"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'grey.300',
                  fontSize: 12,
                  letterSpacing: 0.5,
                }}
              >
                No preview
              </Box>
            )}

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)',
              }}
            />

            <PlayCircleOutlineIcon
              sx={{
                position: 'absolute',
                inset: 0,
                margin: 'auto',
                color: 'common.white',
                fontSize: 52,
                opacity: 0.9,
              }}
            />

            {video.tag ? (
              <Chip
                label={video.tag}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'common.white',
                }}
              />
            ) : null}

            {video.duration ? (
              <Box
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  px: 0.75,
                  py: 0.25,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'common.white',
                  borderRadius: 0.75,
                  fontSize: '0.75rem',
                }}
              >
                {video.duration}
              </Box>
            ) : null}
          </Box>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700}>
              {video.title}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
