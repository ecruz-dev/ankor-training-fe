// src/features/evaluations/api/evaluationsApi.ts

import type {
  EvaluationDetailAthlete,
  EvaluationDetailCategory,
  EvaluationDetailItem,
  EvaluationDetailRow,
  EvaluationImprovementSkillRow,
  EvaluationImprovementSkillsResponse,
  EvaluationSkillVideoRow,
  EvaluationSkillVideosResponse,
  EvaluationSubskillRatingsCategory,
  EvaluationSubskillRatingsResponse,
  EvaluationWorkoutProgressResponse,
  EvaluationWorkoutProgressUpdateResponse,
  EvaluationWorkoutProgressRow,
  EvaluationWorkoutDrillLevel,
  EvaluationWorkoutDrillsResponse,
  EvaluationInput,
  EvaluationListRow,
  EvaluationMatrixUpdatePayload,
  LatestEvaluationRow,
  LatestEvaluationsResponse,
  ListEvaluationsHttpPayload,
  RpcBulkCreateEvaluationsResponse,
  SubmitEvaluationResponse,
} from './types'
import { apiFetch, type ApiFetchOptions } from '../../../shared/api/apiClient'

export type {
  EvaluationDetailAthlete,
  EvaluationDetailCategory,
  EvaluationDetailItem,
  EvaluationDetailRow,
  EvaluationImprovementSkillRow,
  EvaluationImprovementSkillsResponse,
  EvaluationSkillVideoRow,
  EvaluationSkillVideosResponse,
  EvaluationSubskillRatingsCategory,
  EvaluationSubskillRatingsResponse,
  EvaluationWorkoutProgressResponse,
  EvaluationWorkoutProgressUpdateResponse,
  EvaluationWorkoutProgressRow,
  EvaluationWorkoutDrillLevel,
  EvaluationWorkoutDrillsResponse,
  EvaluationInput,
  EvaluationItemInput,
  EvaluationItemRecord,
  EvaluationListItem,
  EvaluationListRow,
  EvaluationMatrixOperation,
  EvaluationMatrixRemoveAthleteOp,
  EvaluationMatrixUpdatePayload,
  LatestEvaluationRow,
  LatestEvaluationsResponse,
  EvaluationMatrixUpsertRatingOp,
  EvaluationRecord,
  EvaluationUpdateInput,
  ListEvaluationsHttpPayload,
  RpcBulkCreateEvaluationsResponse,
  RpcBulkUpdateEvaluationsResponse,
  SubmitEvaluationResponse,
} from './types'

// ---------- Helpers ----------

const DEFAULT_BASE_URL =
  ((typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  'http://localhost:8000'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function fetchJson<T>(
  url: string,
  options: ApiFetchOptions,
): Promise<T> {
  const res = await apiFetch(url, options)
  const json = (await res.json().catch(() => undefined)) as T | undefined

  if (!res.ok) {
    const reason = (json as any)?.error || `${res.status} ${res.statusText}`
    throw new Error(reason)
  }

  return json as T
}

function normalizeEvaluationDetail(raw: any): EvaluationDetailRow {
  return {
    id: raw.id,
    org_id: raw.org_id,
    template_id: raw.template_id ?? null,
    template_name: raw.template_name ?? null,
    coach_id: raw.coach_id ?? null,
    teams_id: raw.teams_id ?? null,
    team_name: raw.team_name ?? null,
    notes: raw.notes ?? null,
    created_at: raw.created_at,

    evaluation_items: (raw.evaluation_items ?? []).map(
      (item: any): EvaluationDetailItem => ({
        id: item.id,
        evaluation_id: item.evaluation_id,
        athlete_id: item.athlete_id,
        athlete_first_name:
          item.athlete_first_name ?? item.athletes?.first_name ?? null,
        athlete_last_name:
          item.athlete_last_name ?? item.athletes?.last_name ?? null,
        subskill_id: item.subskill_id,
        rating: item.rating ?? null,
        comment: item.comment ?? null,
        created_at: item.created_at,
      }),
    ),

    athletes: (raw.athletes ?? []).map(
      (ath: any): EvaluationDetailAthlete => ({
        id: ath.id,
        first_name: ath.first_name ?? null,
        last_name: ath.last_name ?? null,
      }),
    ),

    categories: (raw.categories ?? raw.scorecard_categories ?? []).map(
      (cat: any): EvaluationDetailCategory => ({
        id: cat.id,
        template_id: cat.template_id,
        name: cat.name,
        description: cat.description ?? null,
        position: cat.position ?? null,
      }),
    ),
  }
}

// ---------- Bulk create ----------

export async function rpcBulkCreateEvaluations(
  payload: { evaluations: EvaluationInput[] },
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<RpcBulkCreateEvaluationsResponse> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options
  const url = `${baseUrl}/functions/v1/api/evaluations/bulk-create`

  const data = await fetchJson<RpcBulkCreateEvaluationsResponse>(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    orgId,
  })

  if (!data?.ok) {
    throw new Error((data as any)?.error || 'Bulk create evaluations failed.')
  }

  return data
}

// ---------- Bulk update ----------

export async function rpcBulkUpdateEvaluations(
  evaluationId: string,
  payload: EvaluationMatrixUpdatePayload,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<EvaluationDetailRow> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options
  const url = `${baseUrl}/functions/v1/api/evaluations/eval/${evaluationId}/matrix`

  const json = await fetchJson<any>(url, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Matrix update failed.')
  }

  const raw = json?.evaluation ?? json?.data ?? json
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid response from evaluation matrix endpoint')
  }

  return normalizeEvaluationDetail(raw)
}

// ---------- Submit evaluation ----------

/**
 * POST /functions/v1/api/evaluations/:id/submit
 *
 * If backend returns the updated evaluation object, this returns a normalized EvaluationDetailRow.
 * If backend returns only { ok: true }, this returns null.
 */
export async function submitEvaluation(
  evaluationId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<EvaluationDetailRow | null> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/submit`

  const json = await fetchJson<SubmitEvaluationResponse | any>(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Submit evaluation failed.')
  }

  const raw = json?.evaluation ?? json?.data ?? json

  // If the backend doesn't return an evaluation object, we still consider submit successful.
  if (!raw || typeof raw !== 'object' || !(raw as any).id) return null

  return normalizeEvaluationDetail(raw)
}

/**
 * GET /functions/v1/api/evaluations/list
 * Normalizes backend shape into EvaluationListRow[]
 */
export async function listEvaluations(params: {
  baseUrl?: string
  orgId?: string | null
} = {}): Promise<EvaluationListRow[]> {
  const { baseUrl = DEFAULT_BASE_URL, orgId = null } = params
  const url = `${baseUrl}/functions/v1/api/evaluations/list`

  const json = await fetchJson<ListEvaluationsHttpPayload | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  const rawRows: any[] = Array.isArray(json) ? json : json?.data ?? []

  return rawRows.map((row) => ({
    id: row.id,
    org_id: row.org_id,
    scorecard_template_id: row.scorecard_template_id ?? row.template_id ?? null,
    scorecard_template_name: row.scorecard_template_name ?? null,
    team_name: row.team_name ?? null,
    coach_id: row.coach_id ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at ?? row.createdAt ?? row.created ?? '',
  }))
}

/**
 * GET /functions/v1/api/evaluations/latest
 */
export async function listLatestEvaluations(params: {
  athleteId?: string
  userId?: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
  scorecardName?: string
  coach?: string
  date?: string
}): Promise<{ rows: LatestEvaluationRow[]; count: number }> {
  const {
    athleteId,
    userId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 10,
    offset = 0,
    scorecardName,
    coach,
    date,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (userId) search.set('user_id', userId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))
  if (scorecardName) search.set('scorecard_name', scorecardName)
  if (coach) search.set('coach', coach)
  if (date) search.set('date', date)

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/latest${query ? `?${query}` : ''}`

  const json = await fetchJson<LatestEvaluationsResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load latest evaluations.')
  }

  const rows: LatestEvaluationRow[] = Array.isArray(json?.data) ? json.data : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/latest/by-evaluation
 * Filters latest evaluations by evaluation_id and athlete_id.
 */
export async function listLatestEvaluationsByEvaluation(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: LatestEvaluationRow[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (evaluationId) search.set('evaluation_id', evaluationId)
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/latest/by-evaluation${query ? `?${query}` : ''}`

  const json = await fetchJson<LatestEvaluationsResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load evaluation report.')
  }

  const rows: LatestEvaluationRow[] = Array.isArray(json?.data) ? json.data : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/:id/improvement-skills
 * Returns the improvement skills for a given evaluation and athlete.
 */
export async function listEvaluationImprovementSkills(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: EvaluationImprovementSkillRow[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/improvement-skills${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationImprovementSkillsResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load improvement skills.')
  }

  const rows: EvaluationImprovementSkillRow[] = Array.isArray(json?.data)
    ? json.data
    : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/:id/skill-videos
 * Returns skill videos for a given evaluation and athlete.
 */
export async function listEvaluationSkillVideos(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: EvaluationSkillVideoRow[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/skill-videos${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationSkillVideosResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load skill videos.')
  }

  const rows: EvaluationSkillVideoRow[] = Array.isArray(json?.data)
    ? json.data
    : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/:id/subskill-ratings
 * Returns subskill ratings grouped by category for a given evaluation and athlete.
 */
export async function listEvaluationSubskillRatings(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: EvaluationSubskillRatingsCategory[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/subskill-ratings${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationSubskillRatingsResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load subskill ratings.')
  }

  const rows: EvaluationSubskillRatingsCategory[] = Array.isArray(json?.data)
    ? json.data
    : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/:id/workout-progress
 * Returns workout progress for a given evaluation and athlete.
 */
export async function listEvaluationWorkoutProgress(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: EvaluationWorkoutProgressRow[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/workout-progress${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationWorkoutProgressResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load workout progress.')
  }

  const rows: EvaluationWorkoutProgressRow[] = Array.isArray(json?.data)
    ? json.data
    : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * POST /functions/v1/api/evaluations/:id/workout-progress
 * Updates workout progress for a given evaluation and athlete.
 */
export async function updateEvaluationWorkoutProgress(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<EvaluationWorkoutProgressRow | null> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/workout-progress${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationWorkoutProgressUpdateResponse | any>(
    url,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      orgId,
    },
  )

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to update workout progress.')
  }

  const raw = (json as any)?.data
  if (Array.isArray(raw)) return raw[0] ?? null
  if (raw && typeof raw === 'object') return raw as EvaluationWorkoutProgressRow
  return null
}

/**
 * GET /functions/v1/api/evaluations/:id/workout-drills
 * Returns workout drills (videos) for a given evaluation and athlete.
 */
export async function listEvaluationWorkoutDrills(params: {
  evaluationId: string
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: EvaluationWorkoutDrillLevel[]; count: number }> {
  const {
    evaluationId,
    athleteId,
    baseUrl = DEFAULT_BASE_URL,
    orgId = null,
    limit = 200,
    offset = 0,
  } = params

  const search = new URLSearchParams()
  if (athleteId) search.set('athlete_id', athleteId)
  if (typeof limit === 'number') search.set('limit', String(limit))
  if (typeof offset === 'number') search.set('offset', String(offset))

  const query = search.toString()
  const url = `${baseUrl}/functions/v1/api/evaluations/${evaluationId}/workout-drills${query ? `?${query}` : ''}`

  const json = await fetchJson<EvaluationWorkoutDrillsResponse | any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  if (json?.ok === false) {
    throw new Error(json?.error || 'Failed to load workout drills.')
  }

  const rows: EvaluationWorkoutDrillLevel[] = Array.isArray(json?.data)
    ? json.data
    : []
  const count = typeof json?.count === 'number' ? json.count : rows.length

  return { rows, count }
}

/**
 * GET /functions/v1/api/evaluations/latest
 * Convenience wrapper for fetching evaluations by athlete.
 */
export async function listAthleteEvaluations(params: {
  athleteId: string
  baseUrl?: string
  orgId?: string | null
  limit?: number
  offset?: number
  scorecardName?: string
  coach?: string
  date?: string
}): Promise<{ rows: LatestEvaluationRow[]; count: number }> {
  return listLatestEvaluations(params)
}

/**
 * GET /functions/v1/api/evaluations/eval/:id
 * Returns a normalized EvaluationDetailRow
 */
export async function getEvaluationById(
  evaluationId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<EvaluationDetailRow> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options
  const url = `${baseUrl}/functions/v1/api/evaluations/eval/${evaluationId}`

  const json = await fetchJson<any>(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    orgId,
  })

  const raw = json?.evaluation ?? json?.data ?? json

  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid response from evaluation detail endpoint')
  }

  return normalizeEvaluationDetail(raw)
}
