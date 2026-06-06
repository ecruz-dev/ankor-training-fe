import * as React from 'react'
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import EvaluationsListFilters from '../components/list/EvaluationsListFilters'
import EvaluationsListHeader from '../components/list/EvaluationsListHeader'
import EvaluationsListMobile from '../components/list/EvaluationsListMobile'
import EvaluationsListTable from '../components/list/EvaluationsListTable'
import { useEvaluationsList } from '../hooks/useEvaluationsList'
import { filterEvaluationRows } from '../utils/filterEvaluationRows'
import { useAuth } from '../../../app/providers/AuthProvider'
import { deleteEvaluation, type EvaluationListRow } from '../api/evaluationsApi'

export default function EvaluationsListPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { profile, loading: authLoading } = useAuth()
  const orgId = profile?.default_org_id?.trim() || null
  const { rows, loading, error, reload } = useEvaluationsList(orgId)
  const [search, setSearch] = React.useState('')
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(() => new Set())
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const isLoading = loading || authLoading

  const filteredRows = React.useMemo(
    () => filterEvaluationRows(rows, search).filter((row) => !deletedIds.has(row.id)),
    [deletedIds, rows, search],
  )

  const handleCreate = React.useCallback(() => {
    navigate('/evaluations/create')
  }, [navigate])

  const handleView = React.useCallback(
    (id: string) => {
      navigate(`/evaluations/${id}`)
    },
    [navigate],
  )

  const handleEdit = React.useCallback(
    (id: string) => {
      navigate(`/evaluations/${id}/edit`)
    },
    [navigate],
  )

  const handleDelete = React.useCallback(
    async (row: EvaluationListRow) => {
      const resolvedOrgId = orgId?.trim() || ''
      if (!resolvedOrgId) {
        setDeleteError('Missing org_id for this account.')
        return
      }

      const label = row.team_name || row.scorecard_template_name || row.id
      const confirmed = window.confirm(`Delete evaluation "${label}"?`)
      if (!confirmed) return

      setDeletingId(row.id)
      setDeleteError(null)
      try {
        await deleteEvaluation(row.id, { orgId: resolvedOrgId })
        setDeletedIds((current) => {
          const next = new Set(current)
          next.add(row.id)
          return next
        })
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete evaluation.')
      } finally {
        setDeletingId(null)
      }
    },
    [orgId],
  )

  React.useEffect(() => {
    setDeletedIds(new Set())
    setDeleteError(null)
  }, [orgId])

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <EvaluationsListHeader isMobile={isMobile} onCreate={handleCreate} />
        <EvaluationsListFilters search={search} onSearchChange={setSearch} />

        {error || deleteError ? (
          <Paper sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="error">
                {error || deleteError}
              </Typography>
              {error ? (
                <Button size="small" variant="outlined" onClick={reload}>
                  Retry
                </Button>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        {isMobile ? (
          <EvaluationsListMobile
            rows={filteredRows}
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ) : (
          <EvaluationsListTable
            rows={filteredRows}
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </Stack>
    </Box>
  )
}
