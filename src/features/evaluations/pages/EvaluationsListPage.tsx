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

export default function EvaluationsListPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { profile, loading: authLoading } = useAuth()
  const orgId = profile?.default_org_id?.trim() || null
  const { rows, loading, error, reload } = useEvaluationsList(orgId)
  const [search, setSearch] = React.useState('')
  const isLoading = loading || authLoading

  const filteredRows = React.useMemo(
    () => filterEvaluationRows(rows, search),
    [rows, search],
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <EvaluationsListHeader isMobile={isMobile} onCreate={handleCreate} />
        <EvaluationsListFilters search={search} onSearchChange={setSearch} />

        {error ? (
          <Paper sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="error">
                {error}
              </Typography>
              <Button size="small" variant="outlined" onClick={reload}>
                Retry
              </Button>
            </Stack>
          </Paper>
        ) : null}

        {isMobile ? (
          <EvaluationsListMobile
            rows={filteredRows}
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
          />
        ) : (
          <EvaluationsListTable
            rows={filteredRows}
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
          />
        )}
      </Stack>
    </Box>
  )
}
