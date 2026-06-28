import { apiFetch } from '../../../shared/api/apiClient'

export type OrganizationListItem = {
  id: string
  name: string
  slug: string
  sport_mode: 'single' | 'multi' | null
  program_gender: 'boys' | 'girls' | 'coed'
  maxBelowThresholdRatingsAllowed: number | null
  maxWorkoutReps: number | null
  sport_id: string | null
  created_at: string
  updated_at: string
}

export type UpdateOrganizationInput = {
  name: string
  slug: string
  sport_mode: 'single' | 'multi' | null
  program_gender: 'boys' | 'girls' | 'coed'
  maxBelowThresholdRatingsAllowed: number | null
  maxWorkoutReps: number | null
  sport_id: string | null
}

type OrganizationsListResponse =
  | {
      ok: true
      count?: number
      limit?: number
      offset?: number
      data?: OrganizationListItem[]
    }
  | { ok: false; error: string }

type OrganizationResponse =
  | { ok: true; data: OrganizationListItem }
  | { ok: false; error: string }

const DEFAULT_BASE_URL =
  ((typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  'http://localhost:8000'

export async function listOrganizations(
  baseUrl = DEFAULT_BASE_URL,
): Promise<OrganizationListItem[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/api/org/list`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    includeOrgId: false,
  })

  const payload = (await res.json().catch(() => undefined)) as
    | OrganizationsListResponse
    | undefined

  if (!res.ok) {
    throw new Error(
      (payload as { error?: string } | undefined)?.error ||
        `${res.status} ${res.statusText}`,
    )
  }

  if (!payload?.ok) {
    throw new Error(payload?.error || 'Failed to load organizations.')
  }

  return Array.isArray(payload.data) ? payload.data : []
}

export async function getOrganizationById(
  organizationId: string,
  baseUrl = DEFAULT_BASE_URL,
): Promise<OrganizationListItem> {
  const id = organizationId.trim()
  if (!id) {
    throw new Error('Organization id is required.')
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/api/org/${encodeURIComponent(id)}`
  const res = await apiFetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    includeOrgId: false,
  })

  const payload = (await res.json().catch(() => undefined)) as
    | OrganizationResponse
    | undefined

  if (!res.ok) {
    throw new Error(
      (payload as { error?: string } | undefined)?.error ||
        `${res.status} ${res.statusText}`,
    )
  }

  if (!payload?.ok || !payload.data) {
    throw new Error(payload?.error || 'Failed to load organization.')
  }

  return payload.data
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<OrganizationListItem> {
  const id = organizationId.trim()
  if (!id) {
    throw new Error('Organization id is required.')
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/api/org/${encodeURIComponent(id)}`
  const res = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    includeOrgId: false,
  })

  const payload = (await res.json().catch(() => undefined)) as
    | OrganizationResponse
    | undefined

  if (!res.ok) {
    throw new Error(
      (payload as { error?: string } | undefined)?.error ||
        `${res.status} ${res.statusText}`,
    )
  }

  if (!payload?.ok || !payload.data) {
    throw new Error(payload?.error || 'Failed to update organization.')
  }

  return payload.data
}
