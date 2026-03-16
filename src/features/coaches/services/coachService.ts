// src/services/coachService.ts
// Fetch wrapper for /functions/v1/api/coaches/* endpoints.

import { apiFetch } from "../../../shared/api/apiClient";

export type CoachListItem = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cell_number: string | null;
  title: string | null;
};

export type CoachesListResponse =
  | { ok: true; count?: number; items?: CoachListItem[]; data?: CoachListItem[] }
  | { ok: false; error: string };

export type CoachSummaryData = {
  total_teams: number;
  total_athletes: number;
  total_evaluations: number;
  total_plans_share: number;
};

export type CoachSummaryResponse =
  | { ok: true; data: CoachSummaryData }
  | { ok: false; error: string };

export type CoachDetailResponse =
  | { ok: true; coach?: CoachListItem; data?: CoachListItem }
  | { ok: false; error: string };

export type CreateCoachInput = {
  org_id: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  cell_number?: string | null;
};

export type CreateCoachResponse =
  | { ok: true; coach?: CoachListItem; data?: CoachListItem }
  | { ok: false; error: string };

export type UpdateCoachInput = {
  full_name?: string | null;
  phone?: string | null;
  cell_number?: string | null;
};

export type UpdateCoachResponse =
  | { ok: true; coach?: CoachListItem; data?: CoachListItem }
  | { ok: false; error: string };

export type ListCoachesParams = {
  orgId: string;
  name?: string;
  email?: string;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function buildListQuery(params: ListCoachesParams) {
  const u = new URLSearchParams();
  u.set("org_id", params.orgId);
  if (params.name?.trim()) u.set("name", params.name.trim());
  if (params.email?.trim()) u.set("email", params.email.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function normalizeCoach(raw: any): CoachListItem {
  const firstName =
    typeof raw?.first_name === "string" && raw.first_name.trim()
      ? raw.first_name.trim()
      : null;
  const lastName =
    typeof raw?.last_name === "string" && raw.last_name.trim()
      ? raw.last_name.trim()
      : null;

  let fullName =
    typeof raw?.full_name === "string" && raw.full_name.trim()
      ? raw.full_name.trim()
      : null;

  if (!fullName) {
    const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
    fullName = combined ? combined : null;
  }

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    user_id:
      typeof raw?.user_id === "string"
        ? raw.user_id
        : typeof raw?.userId === "string"
          ? raw.userId
          : null,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: typeof raw?.email === "string" ? raw.email.trim() : null,
    phone: typeof raw?.phone === "string" ? raw.phone.trim() : null,
    cell_number:
      typeof raw?.cell_number === "string" ? raw.cell_number.trim() : null,
    title: typeof raw?.title === "string" ? raw.title.trim() : null,
  };
}

function normalizeCoachSummary(raw: any): CoachSummaryData {
  const toNumber = (value: unknown) => {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    total_teams: toNumber(raw?.total_teams),
    total_athletes: toNumber(raw?.total_athletes),
    total_evaluations: toNumber(raw?.total_evaluations),
    total_plans_share: toNumber(raw?.total_plans_share),
  };
}

export function coachLabel(
  coach: Pick<CoachListItem, "full_name" | "first_name" | "last_name">,
) {
  return (
    coach.full_name ||
    [coach.first_name, coach.last_name].filter(Boolean).join(" ") ||
    "Unnamed coach"
  );
}

function normalizeCreatePayload(input: CreateCoachInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.full_name?.trim()) throw new Error("full_name is required.");
  if (!input.email?.trim()) throw new Error("email is required.");
  if (!input.password?.trim()) throw new Error("password is required.");

  return {
    org_id: input.org_id.trim(),
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    password: input.password.trim(),
    phone: input.phone?.trim() || null,
    cell_number: input.cell_number?.trim() || null,
  };
}

function normalizeUpdatePayload(input: UpdateCoachInput) {
  const payload: Record<string, unknown> = {};

  const normalizeRequiredString = (value: unknown, field: string) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) {
      throw new Error(`${field} is required.`);
    }
    return trimmed;
  };

  const normalizeOptionalString = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  };

  const fullName = normalizeRequiredString(input.full_name, "full_name");
  if (fullName !== undefined) payload.full_name = fullName;

  const phone = normalizeOptionalString(input.phone);
  if (phone !== undefined) payload.phone = phone;

  const cellNumber = normalizeOptionalString(input.cell_number);
  if (cellNumber !== undefined) payload.cell_number = cellNumber;

  return payload;
}

/**
 * GET /functions/v1/api/coaches/:coachId/summary
 */
export async function getCoachSummary(
  params: {
    coachId: string;
    orgId?: string | null;
    limit?: number;
    offset?: number;
  },
  baseUrl = DEFAULT_BASE_URL,
): Promise<CoachSummaryData> {
  if (!params.coachId?.trim()) {
    throw new Error("coachId is required.");
  }

  const search = new URLSearchParams();
  if (Number.isFinite(params.limit)) search.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) search.set("offset", String(params.offset));

  const query = search.toString();
  const url = `${baseUrl}/functions/v1/api/coaches/${params.coachId.trim()}/summary${query ? `?${query}` : ""}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CoachSummaryResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load coach summary.");
  }

  return normalizeCoachSummary((data as any)?.data ?? {});
}

/**
 * GET /functions/v1/api/coaches/list?org_id=...
 */
export async function listCoaches(
  params: ListCoachesParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: CoachListItem[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildListQuery(params);
  const url = `${baseUrl}/functions/v1/api/coaches/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CoachesListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load coaches.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeCoach(item)).filter((c) => c.id);
  const countRaw = (data as any)?.count;
  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.isFinite(Number(countRaw))
        ? Number(countRaw)
        : undefined;

  return { items, count };
}

/**
 * GET /functions/v1/api/coaches/:coachId
 */
export async function getCoachById(
  coachId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<CoachListItem> {
  if (!coachId?.trim()) {
    throw new Error("coachId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/coaches/${coachId.trim()}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CoachDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load coach.");
  }

  const raw = (data as any)?.coach ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from coach detail endpoint.");
  }

  return normalizeCoach(raw);
}

/**
 * POST /functions/v1/api/coaches/
 */
export async function createCoach(
  input: CreateCoachInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<CoachListItem> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/coaches/`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateCoachResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to create coach.");
  }

  const raw = (data as any)?.coach ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from coach create endpoint.");
  }

  return normalizeCoach(raw);
}

/**
 * PATCH /functions/v1/api/coaches/:coachId
 */
export async function updateCoach(
  coachId: string,
  input: UpdateCoachInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<CoachListItem> {
  if (!coachId?.trim()) {
    throw new Error("coachId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/coaches/${coachId.trim()}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateCoachResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update coach.");
  }

  const raw = (data as any)?.coach ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from coach update endpoint.");
  }

  return normalizeCoach(raw);
}
