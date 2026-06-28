import * as React from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getOrganizationById,
  updateOrganization,
} from '../services/organizationsService'

type OrganizationForm = {
  name: string
  slug: string
  sportMode: '' | 'single' | 'multi'
  programGender: 'boys' | 'girls' | 'coed'
  sportId: string
  maxBelowThresholdRatingsAllowed: string
  maxWorkoutReps: string
}

const EMPTY_FORM: OrganizationForm = {
  name: '',
  slug: '',
  sportMode: '',
  programGender: 'coed',
  sportId: '',
  maxBelowThresholdRatingsAllowed: '',
  maxWorkoutReps: '',
}

function parseNullableNonNegativeInteger(value: string, label: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative whole number.`)
  }
  return parsed
}

export default function EditOrgPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = React.useState<OrganizationForm>(EMPTY_FORM)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

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
        const organization = await getOrganizationById(id)
        if (!active) return
        setForm({
          name: organization.name,
          slug: organization.slug,
          sportMode: organization.sport_mode ?? '',
          programGender: organization.program_gender,
          sportId: organization.sport_id ?? '',
          maxBelowThresholdRatingsAllowed:
            organization.maxBelowThresholdRatingsAllowed?.toString() ?? '',
          maxWorkoutReps: organization.maxWorkoutReps?.toString() ?? '',
        })
      } catch (err) {
        if (active) {
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

  const setField =
    (field: keyof OrganizationForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!form.slug.trim()) {
      setError('Slug is required.')
      return
    }

    try {
      const maxBelowThresholdRatingsAllowed =
        parseNullableNonNegativeInteger(
          form.maxBelowThresholdRatingsAllowed,
          'Maximum below-threshold ratings',
        )
      const maxWorkoutReps = parseNullableNonNegativeInteger(
        form.maxWorkoutReps,
        'Maximum workout reps',
      )

      setSaving(true)
      const updated = await updateOrganization(id, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        sport_mode: form.sportMode || null,
        program_gender: form.programGender,
        sport_id: form.sportId.trim() || null,
        maxBelowThresholdRatingsAllowed,
        maxWorkoutReps,
      })

      setForm({
        name: updated.name,
        slug: updated.slug,
        sportMode: updated.sport_mode ?? '',
        programGender: updated.program_gender,
        sportId: updated.sport_id ?? '',
        maxBelowThresholdRatingsAllowed:
          updated.maxBelowThresholdRatingsAllowed?.toString() ?? '',
        maxWorkoutReps: updated.maxWorkoutReps?.toString() ?? '',
      })
      setSuccess('Organization updated.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update organization.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={3}
        sx={{ maxWidth: 900, width: '100%', mx: 'auto' }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Edit Organization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update organization profile and configuration.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/settings/organization/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading || saving || !id}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField label="Organization ID" value={id} disabled fullWidth />
            <TextField
              label="Name"
              value={form.name}
              onChange={setField('name')}
              disabled={loading || saving}
              required
              fullWidth
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={setField('slug')}
              disabled={loading || saving}
              required
              fullWidth
            />
            <TextField
              select
              label="Program Gender"
              value={form.programGender}
              onChange={setField('programGender')}
              disabled={loading || saving}
              fullWidth
            >
              <MenuItem value="boys">Boys</MenuItem>
              <MenuItem value="girls">Girls</MenuItem>
              <MenuItem value="coed">Coed</MenuItem>
            </TextField>
            <TextField
              select
              label="Sport Mode"
              value={form.sportMode}
              onChange={setField('sportMode')}
              disabled={loading || saving}
              fullWidth
            >
              <MenuItem value="">Not set</MenuItem>
              <MenuItem value="single">Single</MenuItem>
              <MenuItem value="multi">Multi</MenuItem>
            </TextField>
            <TextField
              label="Sport ID"
              value={form.sportId}
              onChange={setField('sportId')}
              disabled={loading || saving}
              fullWidth
            />
            <TextField
              label="Maximum Below-Threshold Ratings"
              type="number"
              value={form.maxBelowThresholdRatingsAllowed}
              onChange={setField('maxBelowThresholdRatingsAllowed')}
              disabled={loading || saving}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              fullWidth
            />
            <TextField
              label="Maximum Workout Reps"
              type="number"
              value={form.maxWorkoutReps}
              onChange={setField('maxWorkoutReps')}
              disabled={loading || saving}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              fullWidth
            />
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}
