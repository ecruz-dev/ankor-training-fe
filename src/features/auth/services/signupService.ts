// src/services/signupService.ts
// Pure logic to call your local backend (no Supabase client).
// POSTs to https://<project>.supabase.co/functions/v1/api/auth/signup
// Use from your component but do NOT modify the component here.

export type Role = 'athlete' | 'coach';

type CommonFields = {
  joinCode: string;
  role: Role;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  cellNumber?: string | null;
  termsAccepted: boolean;
};

type AthleteOnly = {
  graduationYear: number;
  positions: string[]; // e.g. ["Attack"]
};

export type AthleteSignUp = CommonFields & { role: 'athlete' } & AthleteOnly;
export type CoachSignUp   = CommonFields & { role: 'coach' };

export type SignUpInput = AthleteSignUp | CoachSignUp;

export type SignUpResponse = {
  ok: boolean;
  user_id?: string;
  profile_id?: string;
  org_id?: string;
  team_id?: string;
  athlete_id?: string;
  coach_id?: string;
  error?: string;
};

function assertCommonFields(i: CommonFields) {
  if (!i.joinCode?.trim()) throw new Error('Join code is required.');
  if (!i.role) throw new Error('Role is required.');
  if (!i.email?.trim()) throw new Error('Email is required.');
  if (!i.password?.trim()) throw new Error('Password is required.');
  if (!i.firstName?.trim()) throw new Error('First name is required.');
  if (!i.lastName?.trim()) throw new Error('Last name is required.');
  if (!i.username?.trim()) throw new Error('Username is required.');
  if (!i.termsAccepted) throw new Error('You must accept the terms.');
}

function toBackendPayload(input: SignUpInput) {
  const base = {
    joinCode: input.joinCode.trim(),
    role: input.role,
    email: input.email.trim(),
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    username: input.username.trim(),
    cellNumber: input.cellNumber?.trim?.() || null,
    termsAccepted: !!input.termsAccepted,
  };

  if (input.role === 'athlete') {
    return {
      ...base,
      graduationYear: Number(input.graduationYear),
      positions: input.positions, // send exactly what the UI captured
    };
  }

  return base; // coach payload
}

/**
 * Calls your backend for signup.
 * Defaults to https://<project>.supabase.co; override with VITE_BACKEND_URL if desired.
 */
export async function signUp(
  input: SignUpInput,
  baseUrl = (typeof import.meta !== 'undefined' &&
             (import.meta as any).env &&
             (import.meta as any).env.VITE_BACKEND_URL) || 'https://<project>.supabase.co'
): Promise<SignUpResponse> {
  // Basic client-side validation to avoid obvious round-trips
  assertCommonFields(input);
  if (input.role === 'athlete') {
    if (!Number.isFinite(input.graduationYear)) {
      throw new Error('Graduation year is required for athletes.');
    }
    if (!input.positions || input.positions.length === 0) {
      throw new Error('At least one position is required for athletes.');
    }
  }

  const payload = toBackendPayload(input);

  const res = await fetch(`${baseUrl}/functions/v1/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Try to parse JSON either way to surface backend error messages
  const data = (await res
    .json()
    .catch(() => undefined)) as SignUpResponse | undefined;

  if (!res.ok) {
    // HTTP-level failure
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(`Signup failed: ${reason}`);
  }

  if (!data?.ok) {
    // Backend returned ok: false
    throw new Error(data?.error || 'Signup failed.');
  }

  return data;
}

// Optional small helpers to build typed inputs from your form values:
export function makeAthleteInput(params: {
  joinCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  cellNumber?: string | null;
  termsAccepted: boolean;
  graduationYear: number;
  positions: string[];
}): AthleteSignUp {
  return { role: 'athlete', ...params };
}

export function makeCoachInput(params: {
  joinCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  cellNumber?: string | null;
  termsAccepted: boolean;
}): CoachSignUp {
  return { role: 'coach', ...params };
}
