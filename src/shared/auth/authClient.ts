import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'

export type AuthUser = User

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  orgId?: string
  user?: AuthUser | null
}

const REFRESH_SKEW_MS = 60_000

let cachedSession: AuthSession | null = null
let refreshPromise: Promise<AuthSession | null> | null = null

function parseExpiresAt(session: Session): number | undefined {
  if (Number.isFinite(session.expires_at)) {
    return Number(session.expires_at) * 1000
  }
  if (Number.isFinite(session.expires_in)) {
    return Date.now() + Number(session.expires_in) * 1000
  }
  return undefined
}

function extractOrgId(user?: User | null): string | undefined {
  const candidates = [
    (user as any)?.org_id,
    (user as any)?.orgId,
    user?.user_metadata?.org_id,
    user?.user_metadata?.orgId,
    user?.app_metadata?.org_id,
    user?.app_metadata?.orgId,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return undefined
}

function normalizeSupabaseSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? undefined,
    expiresAt: parseExpiresAt(session),
    orgId: extractOrgId(session.user) ?? undefined,
    user: session.user ?? null,
  }
}

function isSessionExpiring(session: AuthSession, skewMs = REFRESH_SKEW_MS) {
  if (!session.expiresAt) return false
  return Date.now() >= session.expiresAt - skewMs
}

export function getStoredSession(): AuthSession | null {
  return cachedSession
}

export function setStoredSession(session: AuthSession | null) {
  cachedSession = session
}

export function clearStoredSession() {
  cachedSession = null
}

export function getAccessToken(): string | null {
  return cachedSession?.accessToken ?? null
}

export function getOrgId(): string | null {
  return cachedSession?.orgId ?? null
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  const e = (email ?? '').trim()
  const p = password ?? ''

  if (!e || !/\S+@\S+\.\S+/.test(e)) {
    throw new Error('Please enter a valid email address.')
  }
  if (!p) {
    throw new Error('Please enter your password.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: e,
    password: p,
  })

  if (error) {
    throw new Error(error.message || 'Unable to sign in.')
  }

  if (!data.session) {
    throw new Error('Login did not return a session.')
  }

  const normalized = normalizeSupabaseSession(data.session)
  setStoredSession(normalized)
  return normalized
}

export async function refreshAuthSession(
  _current?: AuthSession,
): Promise<AuthSession> {
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    throw new Error(error.message || 'Unable to refresh session.')
  }

  if (!data.session) {
    throw new Error('Refresh did not return a session.')
  }

  const normalized = normalizeSupabaseSession(data.session)
  setStoredSession(normalized)
  return normalized
}

export async function ensureValidSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message || 'Unable to load session.')
  }

  if (!data.session) {
    clearStoredSession()
    return null
  }

  const normalized = normalizeSupabaseSession(data.session)
  setStoredSession(normalized)

  if (!isSessionExpiring(normalized)) {
    return normalized
  }

  if (!refreshPromise) {
    refreshPromise = refreshAuthSession(normalized)
      .then((refreshed) => refreshed)
      .catch(() => {
        clearStoredSession()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
