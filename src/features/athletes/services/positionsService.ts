// src/services/positionsService.ts
// Fetch wrapper for /functions/v1/api/positions/list

import { apiFetch } from "../../../shared/api/apiClient";

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

export type Position = {
  id: string;
  sport_id: string | null;
  code: string | null;
  name: string;
};

export type PositionsListResponse =
  | { ok: true; count?: number; items?: Position[]; data?: Position[] }
  | { ok: false; error: string };

export type ListPositionsParams = {
  orgId: string;
  limit?: number;
  offset?: number;
};

export type ListPositionsOptions = {
  requireAuth?: boolean;
  includeOrgId?: boolean;
  headers?: Record<string, string>;
};

function buildPositionsQuery(params: ListPositionsParams) {
  const u = new URLSearchParams();
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function normalizePosition(raw: any): Position {
  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    sport_id: typeof raw?.sport_id === "string" ? raw.sport_id : null,
    code: typeof raw?.code === "string" ? raw.code.trim() || null : null,
    name: typeof raw?.name === "string" ? raw.name.trim() : "",
  };
}

/**
 * GET /functions/v1/api/positions/list?org_id=...
 */
export async function listPositions(
  params: ListPositionsParams,
  baseUrl = DEFAULT_BASE_URL,
  options: ListPositionsOptions = {},
): Promise<{ items: Position[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildPositionsQuery(params);
  const url =
    qs.length > 0
      ? `${baseUrl}/functions/v1/api/positions/list?${qs}`
      : `${baseUrl}/functions/v1/api/positions/list`;

  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };

  const res = await apiFetch(url, {
    method: "GET",
    headers,
    orgId: params.orgId ?? null,
    requireAuth: options.requireAuth,
    includeOrgId: options.includeOrgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PositionsListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load positions.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems
    .map((item) => normalizePosition(item))
    .filter((pos) => pos.id && pos.name);
  const countRaw = (data as any)?.count;
  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.isFinite(Number(countRaw))
        ? Number(countRaw)
        : undefined;

  return { items, count };
}
