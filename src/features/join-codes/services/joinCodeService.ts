// src/features/join-codes/services/joinCodeService.ts
// Pure fetch wrappers to call /functions/v1/api/join-codes endpoints.

import { apiFetch } from "../../../shared/api/apiClient";

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

export type JoinCode = {
  code: string;
  org_id: string | null;
  team_id: string | null;
  max_uses: number | null;
  used_count: number | null;
  uses_count: number | null;
  expires_at: string | null;
  is_active: boolean;
  disabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type JoinCodesListResponse =
  | { ok: true; count?: number; items?: JoinCode[]; data?: JoinCode[] }
  | { ok: false; error: string };

export type CreateJoinCodeInput = {
  org_id: string;
  team_id: string | null;
  max_uses?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
  disabled?: boolean;
};

export type CreateJoinCodeResponse =
  | { ok: true; join_code?: JoinCode; data?: JoinCode }
  | { ok: false; error: string };

export type ListJoinCodesParams = {
  orgId?: string;
};

function normalizeCount(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeJoinCode(raw: any): JoinCode {
  const isActiveRaw = raw?.is_active ?? raw?.isActive;
  const disabledRaw = raw?.disabled ?? raw?.isDisabled;
  const maxUsesRaw = raw?.max_uses ?? raw?.maxUses;
  const usedCountRaw = raw?.used_count ?? raw?.usedCount;
  const usesCountRaw = raw?.uses_count ?? raw?.usesCount;

  return {
    code: typeof raw?.code === "string" ? raw.code : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    team_id: typeof raw?.team_id === "string" ? raw.team_id : null,
    max_uses: normalizeCount(maxUsesRaw),
    used_count: normalizeCount(usedCountRaw),
    uses_count: normalizeCount(usesCountRaw),
    expires_at:
      typeof raw?.expires_at === "string"
        ? raw.expires_at
        : typeof raw?.expiresAt === "string"
          ? raw.expiresAt
          : null,
    is_active:
      typeof isActiveRaw === "boolean"
        ? isActiveRaw
        : isActiveRaw == null
          ? true
          : Boolean(isActiveRaw),
    disabled:
      typeof disabledRaw === "boolean"
        ? disabledRaw
        : disabledRaw == null
          ? false
          : Boolean(disabledRaw),
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

function buildListQuery(params: ListJoinCodesParams = {}) {
  const u = new URLSearchParams();
  if (params.orgId?.trim()) u.set("org_id", params.orgId.trim());
  return u.toString();
}

function normalizeCreatePayload(input: CreateJoinCodeInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (input.team_id !== null && input.team_id !== undefined) {
    if (!input.team_id.trim()) {
      throw new Error("team_id is required.");
    }
  }

  const maxUses =
    input.max_uses === null || input.max_uses === undefined
      ? null
      : Number(input.max_uses);
  if (maxUses !== null && !Number.isFinite(maxUses)) {
    throw new Error("max_uses must be a number.");
  }

  const expiresAt =
    input.expires_at && String(input.expires_at).trim()
      ? String(input.expires_at).trim()
      : null;

  return {
    org_id: input.org_id.trim(),
    team_id: input.team_id?.trim() || null,
    max_uses: maxUses,
    expires_at: expiresAt,
    is_active: typeof input.is_active === "boolean" ? input.is_active : true,
    disabled: typeof input.disabled === "boolean" ? input.disabled : false,
  };
}

/**
 * GET /functions/v1/api/join-codes/list?org_id=...
 */
export async function listJoinCodes(
  params: ListJoinCodesParams = {},
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: JoinCode[]; count?: number }> {
  const qs = buildListQuery(params);
  const url =
    qs.length > 0
      ? `${baseUrl}/functions/v1/api/join-codes/list?${qs}`
      : `${baseUrl}/functions/v1/api/join-codes/list`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | JoinCodesListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load join codes.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems
    .map((item) => normalizeJoinCode(item))
    .filter((code) => code.code);
  const count = normalizeCount((data as any)?.count);

  return { items, count: count ?? undefined };
}

/**
 * POST /functions/v1/api/join-codes
 */
export async function createJoinCode(
  input: CreateJoinCodeInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<JoinCode> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/join-codes`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateJoinCodeResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to create join code.");
  }

  const raw = (data as any)?.join_code ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from join code create endpoint.");
  }

  const joinCode = normalizeJoinCode(raw);
  if (!joinCode.code) {
    throw new Error("Join code create response missing code.");
  }

  return joinCode;
}
