// src/services/usersService.ts
// Pure fetch wrapper to call your Deno edge functions under /functions/v1/api/users/*

import { apiFetch } from '../../../shared/api/apiClient'
export type UserRole = "coach" | "athlete" | string;

export type UserListItem = {
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  graduation_year: number | null;
};

export type UsersListResponse =
  | { ok: true; count?: number; items?: UserListItem[]; data?: UserListItem[] }
  | { ok: false; error: string };

export type AuthLoginUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  default_org_id: string | null;
  coach_id: string | null;
  athlete_id: string | null;
};

export type AuthLoginResponse =
  | { ok: true; user: AuthLoginUser }
  | { ok: false; error: string };

export type ListUsersParams = {
  orgId: string;
  q?: string;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function buildListQuery(params: ListUsersParams) {
  const u = new URLSearchParams();
  u.set("org_id", params.orgId);
  if (params.q?.trim()) u.set("q", params.q.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function normalizeGraduationYear(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeFullName(raw: any): string | null {
  if (typeof raw?.full_name === "string" && raw.full_name.trim()) {
    return raw.full_name.trim();
  }

  const fromParts = [raw?.first_name, raw?.last_name]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .trim();

  return fromParts ? fromParts : null;
}

function normalizeUser(raw: any): UserListItem {
  const id =
    typeof raw?.user_id === "string"
      ? raw.user_id
      : typeof raw?.id === "string"
        ? raw.id
        : "";

  const phone =
    typeof raw?.phone === "string"
      ? raw.phone
      : typeof raw?.cell_number === "string"
        ? raw.cell_number
        : null;

  return {
    user_id: id,
    role: typeof raw?.role === "string" ? raw.role : "",
    full_name: normalizeFullName(raw),
    phone,
    graduation_year: normalizeGraduationYear(
      raw?.graduation_year ?? raw?.grad_year ?? raw?.graduationYear,
    ),
  };
}

function normalizeAuthLoginUser(raw: any): AuthLoginUser {
  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    email: typeof raw?.email === "string" ? raw.email : "",
    full_name: normalizeFullName(raw),
    role: typeof raw?.role === "string" ? raw.role : "",
    default_org_id:
      typeof raw?.default_org_id === "string" && raw.default_org_id.trim()
        ? raw.default_org_id.trim()
        : null,
    coach_id:
      typeof raw?.coach_id === "string" && raw.coach_id.trim()
        ? raw.coach_id.trim()
        : null,
    athlete_id:
      typeof raw?.athlete_id === "string" && raw.athlete_id.trim()
        ? raw.athlete_id.trim()
        : null,
  };
}

/**
 * GET /functions/v1/api/users/list?org_id=...
 */
export async function listUsers(
  params: ListUsersParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: UserListItem[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildListQuery(params);
  const url = `${baseUrl}/functions/v1/api/users/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UsersListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load users.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeUser(item)).filter((u) => u.user_id);
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
 * POST /functions/v1/api/auth/login
 */
export async function loginUser(
  params: { userId: string },
  baseUrl = DEFAULT_BASE_URL,
): Promise<AuthLoginUser> {
  if (!params.userId?.trim()) {
    throw new Error("userId is required.");
  }

  const url = `${baseUrl}/functions/v1/api/auth/login`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: params.userId.trim() }),
    includeOrgId: false,
  });

  const data = (await res.json().catch(() => undefined)) as
    | AuthLoginResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Login failed.");
  }

  return normalizeAuthLoginUser(data.user);
}

export function userLabel(user: UserListItem) {
  return user.full_name || "Unnamed user";
}
