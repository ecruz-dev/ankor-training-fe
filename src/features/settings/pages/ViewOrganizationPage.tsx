import * as React from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getOrganizationById,
  type OrganizationListItem,
} from '../services/organizationsService'

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ''
    ? 'Not set'
    : String(value)
}

export default function ViewOrganizationPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [organization, setOrganization] =
    React.useState<OrganizationListItem | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadOrganization = async () => {
      if (!id) {
        setError('Missing organization id in route.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await getOrganizationById(id)
        if (active) setOrganization(result)
      } catch (err) {
        if (active) {
          setOrganization(null)
          setError(
            err instanceof Error ? err.message : 'Failed to load organization.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadOrganization()

    return () => {
      active = false
    }
  }, [id])

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1000, width: '100%', mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Organization Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View organization profile and configuration.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/settings/organization')}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/settings/organization/${id}/edit`)}
              disabled={!organization}
            >
              Edit
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography color="text.secondary">
              Loading organization details...
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {organization && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                {organization.name}
              </Typography>
              <Divider />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <TextField
                  label="Organization ID"
                  value={organization.id}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Name"
                  value={organization.name}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Slug"
                  value={organization.slug}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Program Gender"
                  value={formatValue(organization.program_gender)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Sport Mode"
                  value={formatValue(organization.sport_mode)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Sport ID"
                  value={formatValue(organization.sport_id)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Maximum Below-Threshold Ratings"
                  value={formatValue(
                    organization.maxBelowThresholdRatingsAllowed,
                  )}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Maximum Workout Reps"
                  value={formatValue(organization.maxWorkoutReps)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Created"
                  value={formatDateTime(organization.created_at)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="Updated"
                  value={formatDateTime(organization.updated_at)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </Box>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  )
}
