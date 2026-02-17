import * as React from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EventNoteIcon from '@mui/icons-material/EventNote'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import GroupsIcon from '@mui/icons-material/Groups'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { getCoachSummary } from '../../coaches/services/coachService'

type SnapshotKey = 'teams' | 'athletes' | 'evaluations' | 'plans'

const QUICK_ACTIONS = [
  {
    label: 'New Evaluation',
    to: '/evaluations/create',
    icon: <AssignmentIcon fontSize="small" />,
  },
  {
    label: 'Create Practice Plan',
    to: '/practice-plans/new',
    icon: <EventNoteIcon fontSize="small" />,
  },
  {
    label: 'Add Drill',
    to: '/drills/new',
    icon: <FitnessCenterIcon fontSize="small" />,
  },
  {
    label: 'Create Team',
    to: '/teams/new',
    icon: <GroupsIcon fontSize="small" />,
  },
]

export default function CoachHomePage() {
  const { orgId, coachId, profile, user } = useAuth()
  const [snapshotLoading, setSnapshotLoading] = React.useState(false)
  const [snapshotError, setSnapshotError] = React.useState<string | null>(null)
  const [snapshot, setSnapshot] = React.useState({
    teams: 0,
    athletes: 0,
    evaluations: 0,
    plans: 0,
  })

  React.useEffect(() => {
    if (!orgId || !coachId) {
      setSnapshotError(null)
      setSnapshotLoading(false)
      return
    }

    let active = true

    setSnapshotLoading(true)
    setSnapshotError(null)

    getCoachSummary({ coachId, orgId, limit: 50, offset: 0 })
      .then((data) => {
        if (!active) return
        setSnapshot({
          teams: data.total_teams ?? 0,
          athletes: data.total_athletes ?? 0,
          evaluations: data.total_evaluations ?? 0,
          plans: data.total_plans_share ?? 0,
        })
      })
      .catch((err: any) => {
        if (!active) return
        setSnapshotError(err?.message || 'Failed to load team snapshot.')
      })
      .finally(() => {
        if (active) setSnapshotLoading(false)
      })

    return () => {
      active = false
    }
  }, [orgId, coachId])

  const coachName = React.useMemo(() => {
    const metaName =
      typeof user?.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : ''
    const rawName = profile?.full_name?.trim() || metaName.trim()
    return rawName || 'Coach'
  }, [profile?.full_name, user?.user_metadata])

  const formatSnapshotValue = (key: SnapshotKey) => {
    if (!orgId || !coachId) return '-'
    if (snapshotLoading) return '...'
    if (snapshotError) return '-'
    return String(snapshot[key])
  }

  const snapshotStats = [
    {
      key: 'teams' as const,
      label: 'Teams',
      value: formatSnapshotValue('teams'),
      icon: <GroupsIcon fontSize="small" />,
    },
    {
      key: 'athletes' as const,
      label: 'Athletes',
      value: formatSnapshotValue('athletes'),
      icon: <PeopleAltIcon fontSize="small" />,
    },
    {
      key: 'evaluations' as const,
      label: 'Evaluations',
      value: formatSnapshotValue('evaluations'),
      icon: <AssignmentIcon fontSize="small" />,
    },
    {
      key: 'plans' as const,
      label: 'Practice Plans',
      value: formatSnapshotValue('plans'),
      icon: <EventNoteIcon fontSize="small" />,
    },
  ]

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  Coach Home
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  Welcome back, {coachName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage evaluations, build practice plans, and keep your teams
                  moving forward.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Quick Actions
                </Typography>
                <Grid container spacing={1.5}>
                  {QUICK_ACTIONS.map((action) => (
                    <Grid key={action.label} item xs={12} sm={6}>
                      <Button
                        component={RouterLink}
                        to={action.to}
                        variant="outlined"
                        startIcon={action.icon}
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          borderRadius: 2,
                          py: 1.2,
                        }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <GroupsIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Team Snapshot
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {snapshotStats.map((stat) => (
                <Grid key={stat.key} item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'grey.200',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.icon}
                    </Stack>
                    <Typography variant="h5" fontWeight={600} mt={1}>
                      {stat.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
