// src/services/loginService.ts
// Backend email+password login service (logic only)

import {
  AuthSession,
  AuthUser,
  loginWithEmailPassword as loginWithEmailPasswordClient,
} from '../../../shared/auth/authClient'

export type LoginResult = {
  user: AuthUser | null
  session: AuthSession | null
}

/**
 * Sign in with email and password using the backend auth endpoint.
 * Throws an Error when authentication fails.
 */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
  const session = await loginWithEmailPasswordClient(email, password)
  return { user: session.user ?? null, session }
}
