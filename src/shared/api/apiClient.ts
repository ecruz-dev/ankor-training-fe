import {
  ensureValidSession,
  getOrgId,
  refreshAuthSession,
} from '../auth/authClient'

export type ApiFetchOptions = RequestInit & {
  requireAuth?: boolean
  includeOrgId?: boolean
  orgId?: string | null
}

function withOrgId(url: string, orgId: string) {
  const [base, hash] = url.split('#')
  const [path, query = ''] = base.split('?')
  const params = new URLSearchParams(query)
  if (!params.has('org_id')) {
    params.set('org_id', orgId)
    const next = `${path}?${params.toString()}`
    return hash ? `${next}#${hash}` : next
  }
  return url
}

function hasOrgIdParam(url: string) {
  const [base] = url.split('#')
  const [, query = ''] = base.split('?')
  const params = new URLSearchParams(query)
  return params.has('org_id')
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const {
    requireAuth = true,
    includeOrgId = true,
    orgId,
    ...init
  } = options

  const session = requireAuth ? await ensureValidSession() : null
  const resolvedOrgId = includeOrgId ? orgId ?? getOrgId() : null

  if (includeOrgId && !resolvedOrgId && !hasOrgIdParam(url)) {
    throw new Error('org_id is required for this request.')
  }

  const headers = new Headers(init.headers ?? {})

  if (requireAuth) {
    if (!session?.accessToken) {
      throw new Error('Missing auth token. Please sign in.')
    }
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const finalUrl =
    includeOrgId && resolvedOrgId ? withOrgId(url, resolvedOrgId) : url

  const requestInit: RequestInit = {
    ...init,
    headers,
  }

  let res = await fetch(finalUrl, requestInit)

  if (requireAuth && res.status === 401 && session?.refreshToken) {
    const refreshed = await refreshAuthSession(session).catch(() => null)
    if (refreshed?.accessToken && refreshed.accessToken !== session.accessToken) {
      const retryHeaders = new Headers(headers)
      retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`)
      res = await fetch(finalUrl, { ...requestInit, headers: retryHeaders })
    }
  }

  return res
}
