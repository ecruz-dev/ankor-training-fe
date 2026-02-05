import * as React from 'react'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import { formatEvaluationReportDate } from '../utils/formatEvaluationReportDate'
import {
  listLatestEvaluations,
  type LatestEvaluationRow,
} from '../../evaluations/api/evaluationsApi'
import { useAuth } from '../../../app/providers/AuthProvider'

type EvaluationReportSummary = {
  id: string
  evaluationId: string
  athleteId: string
  athleteName: string
  evaluatorName: string
  scorecardTemplate: string
  evaluatedAt: string
}

export default function CoachEvaluationReportListPage() {
  const navigate = useNavigate()
  const { orgId, loading: authLoading } = useAuth()
  const [rows, setRows] = React.useState<LatestEvaluationRow[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [athleteQuery, setAthleteQuery] = React.useState('')
  const [dateQuery, setDateQuery] = React.useState('')

  const loadReports = React.useCallback(async () => {
    if (!orgId) {
      setRows([])
      setError('Missing org_id for this account.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { rows: data } = await listLatestEvaluations({
        orgId,
        limit: 50,
        offset: 0,
        date: dateQuery || undefined,
      })
      setRows(data ?? [])
    } catch (err) {
      console.error('Failed to load evaluation reports', err)
      setRows([])
      setError('Failed to load evaluation reports')
    } finally {
      setLoading(false)
    }
  }, [dateQuery, orgId])

  React.useEffect(() => {
    if (authLoading) return
    void loadReports()
  }, [authLoading, loadReports])

  const reports = React.useMemo<EvaluationReportSummary[]>(
    () =>
      rows.map((row) => ({
        id: row.evaluation_id,
        evaluationId: row.evaluation_id,
        athleteId: row.athlete_id,
        athleteName: row.athlete_full_name || row.athletes_name || 'Unknown athlete',
        evaluatorName: row.coach_name || 'Unknown coach',
        scorecardTemplate: row.scorecard_name || 'Scorecard',
        evaluatedAt: row.date,
      })),
    [rows],
  )

  const filteredReports = React.useMemo(() => {
    const nameFilter = athleteQuery.trim().toLowerCase()
    const dateFilter = dateQuery.trim()

    return reports.filter((report) => {
      if (nameFilter && !report.athleteName.toLowerCase().includes(nameFilter)) {
        return false
      }

      if (dateFilter && !report.evaluatedAt.startsWith(dateFilter)) {
        return false
      }

      return true
    })
  }, [athleteQuery, dateQuery, reports])

  const isLoading = loading || authLoading

  const handleClearFilters = () => {
    setAthleteQuery('')
    setDateQuery('')
  }

  const handleViewReport = (report: EvaluationReportSummary) => {
    const params = new URLSearchParams()
    if (report.athleteId) params.set('athleteId', report.athleteId)
    params.set('returnTo', 'coach')
    const query = params.toString()
    navigate(`/reports/evaluation-reports/${report.id}${query ? `?${query}` : ''}`)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Evaluation Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review recent evaluations and open any report for details.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            spacing={2}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              size="small"
              label="Athlete"
              value={athleteQuery}
              onChange={(event) => setAthleteQuery(event.target.value)}
              placeholder="Search by athlete name"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              size="small"
              type="date"
              label="Date"
              value={dateQuery}
              onChange={(event) => setDateQuery(event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Button variant="outlined" onClick={handleClearFilters}>
              Clear
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {error ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
              >
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
                <Button size="small" variant="outlined" onClick={loadReports}>
                  Retry
                </Button>
              </Stack>
            </Paper>
          ) : null}

          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading evaluation reports...
            </Typography>
          ) : null}

          {!isLoading && !error && filteredReports.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No evaluation reports found.
              </Typography>
            </Paper>
          ) : null}

          {!isLoading && !error
            ? filteredReports.map((report) => (
                <Paper key={report.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          display: 'block',
                          letterSpacing: 0.8,
                          color: 'primary.main',
                          fontWeight: 700,
                        }}
                      >
                        {formatEvaluationReportDate(report.evaluatedAt)}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {report.scorecardTemplate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Athlete: {report.athleteName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Evaluator: {report.evaluatorName}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={report.athleteName} />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewReport(report)}
                      >
                        View report
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            : null}
        </Stack>
      </Stack>
    </Box>
  )
}
