import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import {
  AuthSession,
  AuthUser,
  clearStoredSession,
  ensureValidSession,
  getOrgId,
  getStoredSession,
  loginWithEmailPassword,
  setStoredSession,
} from '../../shared/auth/authClient'
import { supabase } from '../../lib/supabaseClient'
import { loginUser, type AuthLoginUser } from '../../features/settings/services/usersService'

type AuthContextType = {
  user: AuthUser | null
  session: AuthSession | null
  profile: AuthLoginUser | null
  accessToken: string | null
  orgId: string | null
  coachId: string | null
  athleteId: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<AuthLoginUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async (nextSession: AuthSession | null) => {
    if (!nextSession?.user?.id) return null
    return loginUser({ userId: nextSession.user.id })
  }

  const syncOrgIdFromProfile = (
    nextSession: AuthSession | null,
    nextProfile: AuthLoginUser | null,
  ) => {
    if (!nextSession?.accessToken || !nextProfile?.default_org_id) return nextSession
    if (nextSession.orgId === nextProfile.default_org_id) return nextSession
    const updated = { ...nextSession, orgId: nextProfile.default_org_id }
    setStoredSession(updated)
    setSession(updated)
    return updated
  }

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      try {
        const refreshed = await ensureValidSession()
        const stored = refreshed ?? getStoredSession()
        if (!active) return
        setSession(stored)
        setUser(stored?.user ?? null)
        const nextProfile = await loadProfile(stored).catch((err: any) => {
          if (active) {
            setError(err?.message || 'Failed to load user profile.')
          }
          return null
        })
        if (!active) return
        setProfile(nextProfile)
        syncOrgIdFromProfile(stored, nextProfile)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load session.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSession()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      ensureValidSession()
        .then((next) => {
          if (!active) return
          setSession(next)
          setUser(next?.user ?? null)
        })
        .catch((err: any) => {
          if (!active) return
          setError(err?.message || 'Failed to load session.')
        })
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    const next = await loginWithEmailPassword(email, password)
    setSession(next)
    setUser(next.user ?? null)
    setProfile(null)
    const nextProfile = await loadProfile(next)
    setProfile(nextProfile)
    syncOrgIdFromProfile(next, nextProfile)
  }

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message || 'Failed to sign out.')
    }
    clearStoredSession()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshSession = async () => {
    const refreshed = await ensureValidSession()
    setSession(refreshed)
    setUser(refreshed?.user ?? null)
  }

  const updatePassword = async (newPassword: string) => {
    if (!newPassword?.trim()) {
      return { error: new Error('Password is required.') }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const accessToken = session?.accessToken ?? null
  const orgId = session?.orgId ?? profile?.default_org_id ?? getOrgId()
  const coachId = profile?.coach_id ?? null
  const athleteId = profile?.athlete_id ?? null
  const isAuthenticated = Boolean(accessToken)

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      accessToken,
      orgId,
      coachId,
      athleteId,
      isAuthenticated,
      loading,
      error,
      signIn,
      signOut,
      refreshSession,
      updatePassword,
    }),
    [
      user,
      session,
      profile,
      accessToken,
      orgId,
      coachId,
      athleteId,
      isAuthenticated,
      loading,
      error,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
