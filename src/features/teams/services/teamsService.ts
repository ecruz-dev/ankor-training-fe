// src/services/teamsService.ts
// Pure fetch wrappers to call your Deno edge functions under /functions/v1/api/teams/*
// Mirrors the style of signupService.ts / skillsService.ts (typed, no Supabase client here).

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

import { apiFetch } from '../../../shared/api/apiClient'

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

export type Team = {
  id: string;
  org_id: string | null;
  sport_id?: string | null;
  name: string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TeamsListResponse =
  | { ok: true; count?: number; items?: Team[]; data?: Team[] }
  | { ok: false; error: string };

export type TeamDetailResponse =
  | { ok: true; team?: Team; data?: Team }
  | { ok: false; error: string };

export type CreateTeamInput = {
  org_id: string;
  name: string;
  sport_id?: string | null;
  is_active?: boolean;
};

export type CreateTeamResponse =
  | { ok: true; team?: Team; data?: Team }
  | { ok: false; error: string };

export type UpdateTeamInput = {
  name?: string;
  sport_id?: string | null;
  is_active?: boolean;
};

export type UpdateTeamResponse =
  | { ok: true; team?: Team; data?: Team }
  | { ok: false; error: string };

export type ListTeamsParams = {
  orgId?: string;   // often derived from auth; optional if backend uses RLS
  q?: string;       // optional search (if supported)
  limit?: number;   // optional, let backend default if omitted
  offset?: number;  // optional, let backend default if omitted
};

export type TeamAthlete = {
  team_id: string;
  id: string;
  org_id: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  graduation_year: number | null;
  cell_number: string | null;
  position : string
};

export type AthletesByTeamResponse =
  | { ok: true; count?: number; items?: TeamAthlete[]; data?: TeamAthlete[] }
  | { ok: false; error: string };

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function buildTeamsQuery(params: ListTeamsParams = {}) {
  const u = new URLSearchParams();

  if (params.orgId?.trim()) u.set("org_id", params.orgId.trim());
  if (params.q?.trim()) u.set("q", params.q.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));

  return u.toString();
}

function normalizeTeam(raw: any): Team {
  const isActiveRaw = raw?.is_active ?? raw?.isActive;
  const is_active =
    typeof isActiveRaw === "boolean"
      ? isActiveRaw
      : isActiveRaw == null
        ? true
        : Boolean(isActiveRaw);

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    sport_id: typeof raw?.sport_id === "string" ? raw.sport_id : null,
    name: typeof raw?.name === "string" ? raw.name : "",
    is_active,
    created_at:
      typeof raw?.created_at === "string"
        ? raw.created_at
        : typeof raw?.createdAt === "string"
          ? raw.createdAt
          : null,
    updated_at:
      typeof raw?.updated_at === "string"
        ? raw.updated_at
        : typeof raw?.updatedAt === "string"
          ? raw.updatedAt
          : null,
  };
}

function normalizeCreatePayload(input: CreateTeamInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.name?.trim()) throw new Error("name is required.");

  const sportId = input.sport_id?.trim();
  return {
    org_id: input.org_id.trim(),
    name: input.name.trim(),
    sport_id: sportId ? sportId : null,
    is_active: typeof input.is_active === "boolean" ? input.is_active : true,
  };
}

function normalizeUpdatePayload(input: UpdateTeamInput) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const trimmed = String(input.name ?? "").trim();
    if (!trimmed) throw new Error("name is required.");
    payload.name = trimmed;
  }

  if (input.sport_id !== undefined) {
    const trimmed = String(input.sport_id ?? "").trim();
    payload.sport_id = trimmed ? trimmed : null;
  }

  if (input.is_active !== undefined) {
    if (typeof input.is_active !== "boolean") {
      throw new Error("is_active must be a boolean.");
    }
    payload.is_active = input.is_active;
  }

  return payload;
}

// Small helpers if you want consistent labels in the UI
export function teamLabel(t: Team) {
  return t.name;
}

export function athleteLabel(a: TeamAthlete) {
  return (
    a.full_name ||
    [a.first_name, a.last_name].filter(Boolean).join(" ") ||
    "Unnamed athlete"
  );
}

// ---------------------------------------------------------------------
// getAllTeams
// GET /functions/v1/api/teams/list[?org_id=...]
// ---------------------------------------------------------------------

/**
 * Fetch teams (optionally filtered by org) from your local backend.
 *
 * Defaults to http://localhost:8000; override with VITE_BACKEND_URL if desired.
 *
 * Returns a plain array of Team items.
 */
export async function getAllTeams(
  params: ListTeamsParams = {},
  baseUrl = DEFAULT_BASE_URL
): Promise<Team[]> {
  const qs = buildTeamsQuery(params);
  const url =
    qs.length > 0
      ? `${baseUrl}/functions/v1/api/teams/list?${qs}`
      : `${baseUrl}/functions/v1/api/teams/list`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | TeamsListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to load teams.");
  }

  // Support both { items: [...] } and { data: [...] } payloads
  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  return rawItems.map((item) => normalizeTeam(item)).filter((t) => t.id);
}

/**
 * POST /functions/v1/api/teams
 */
export async function createTeam(
  input: CreateTeamInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<Team> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/teams`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateTeamResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to create team.");
  }

  const raw = (data as any)?.team ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from team create endpoint.");
  }

  const team = normalizeTeam(raw);
  if (!team.id) {
    throw new Error("Team create response missing id.");
  }

  return team;
}

/**
 * GET /functions/v1/api/teams/:id
 */
export async function getTeamById(
  teamId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<Team> {
  if (!teamId?.trim()) {
    throw new Error("teamId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/teams/${teamId}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | TeamDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load team.");
  }

  const raw = (data as any)?.team ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from team detail endpoint.");
  }

  const team = normalizeTeam(raw);
  if (!team.id) {
    throw new Error("Team detail response missing id.");
  }

  return team;
}

/**
 * PATCH /functions/v1/api/teams/:id
 */
export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<Team> {
  if (!teamId?.trim()) {
    throw new Error("teamId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/teams/${teamId}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateTeamResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update team.");
  }

  const raw = (data as any)?.team ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from team update endpoint.");
  }

  const team = normalizeTeam(raw);
  if (!team.id) {
    throw new Error("Team update response missing id.");
  }

  return team;
}

// ---------------------------------------------------------------------
// getAthletesByTeam
// GET /functions/v1/api/teams/athletes-by-team?team_id=<uuid>
// ---------------------------------------------------------------------

/**
 * Fetch all athletes assigned to a given team from your local backend.
 *
 * Returns a plain array of TeamAthlete items.
 */
export async function getAthletesByTeam(
  teamId: string,
  params: { orgId?: string | null; baseUrl?: string } = {},
): Promise<TeamAthlete[]> {
  if (!teamId?.trim()) {
    throw new Error("teamId is required.");
  }

  const baseUrl = params.baseUrl || DEFAULT_BASE_URL;

  const sp = new URLSearchParams();
  sp.set("team_id", teamId.trim());

  const url = `${baseUrl}/functions/v1/api/teams/athletes-by-team?${sp.toString()}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | AthletesByTeamResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to load team athletes.");
  }

  // Support both { items: [...] } and { data: [...] } payloads
  return (data.items ?? (data as any).data ?? []) as TeamAthlete[];
}
