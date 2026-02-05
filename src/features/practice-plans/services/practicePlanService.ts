// src/services/practicePlanService.ts
// Fetch wrappers to call the practice plan endpoints.

import { apiFetch } from '../../../shared/api/apiClient'

export type PlanListType =
  | "custom"
  | "custom-plans"
  | "org-plans"
  | "prebuild"
  | "invited-plans"
  | (string & {});

export type PlanListFilter = {
  type: PlanListType;
  orgId?: string | null;
  user_id?: string;
  limit?: number | string;
  offset?: number | string;
};

export type ListInvitedPlansParams = {
  user_id: string;
  orgId?: string | null;
  limit?: number | string;
  offset?: number | string;
};

export type PlanVisibility = "private" | "org" | "public" | (string & {});
export type PlanStatus = "draft" | "published" | "archived" | (string & {});

export type PracticePlanItemInput = Record<string, unknown>;
export type PracticePlanItem = Record<string, unknown>;

export type PracticePlan = {
  id: string;
  org_id: string | null;
  owner_user_id: string | null;
  name: string;
  description: string | null;
  visibility: PlanVisibility | null;
  status: PlanStatus | null;
  tags: string[];
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
  items?: PracticePlanItem[];
};

export type InvitedPlan = PracticePlan & {
  member_role: string | null;
  invited_at: string | null;
  invited_by: string | null;
};

export type PlansListResponse =
  | { ok: true; count?: number; items?: any[]; plans?: any[]; data?: any[] }
  | { ok: false; error: string };

export type PlanDetailResponse =
  | { ok: true; plan?: any; data?: any }
  | { ok: false; error: string };

export type CreatePlanInput = {
  owner_user_id: string;
  org_id?: string | null;
  type?: string;
  name: string;
  description?: string | null;
  visibility?: PlanVisibility;
  status?: PlanStatus;
  tags?: string[];
  estimated_minutes?: number | string | null;
  items: PracticePlanItemInput[];
};

export type UpdatePlanInput = {
  name?: string;
  description?: string | null;
  visibility?: PlanVisibility;
  status?: PlanStatus;
  tags?: string[];
  estimated_minutes?: number | string | null;
  org_id?: string | null;
  add_items?: PracticePlanItemInput[];
  remove_item_ids?: string[];
};

export type InvitePlanInput = {
  user_ids: string[];
  added_by?: string | null;
};

export type InvitePlanResult = {
  plan_id: string;
  invited_user_ids: string[];
  skipped_user_ids: string[];
};

export type InvitePlanResponse =
  | {
      ok: true;
      plan_id: string;
      invited_user_ids: string[];
      skipped_user_ids?: string[];
    }
  | { ok: false; error: string };

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function coerceInteger(value: unknown, field: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer.`);
  }

  return Number(parsed);
}

function normalizeLimit(value: unknown) {
  const parsed = value === undefined ? 50 : coerceInteger(value ?? 0, "limit");
  if (parsed < 1 || parsed > 200) {
    throw new Error("limit must be between 1 and 200.");
  }
  return parsed;
}

function normalizeOffset(value: unknown) {
  const parsed = value === undefined ? 0 : coerceInteger(value ?? 0, "offset");
  if (parsed < 0) {
    throw new Error("offset must be at least 0.");
  }
  return parsed;
}

function normalizeNullableInteger(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = coerceInteger(value, field);
  if (parsed < 0) {
    throw new Error(`${field} must be at least 0.`);
  }
  return parsed;
}

function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function normalizeTags(raw: unknown): string[] {
  if (typeof raw === "string") {
    return normalizeStringArray(raw.split(","));
  }
  return normalizeStringArray(raw);
}

function normalizeEstimatedMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(parsed) ? Number(parsed) : null;
}

function normalizePlanItems(raw: any): PracticePlanItem[] | undefined {
  const candidates = [
    raw?.items,
    raw?.plan_items,
    raw?.planItems,
    raw?.segments,
    raw?.practice_plan_items,
    raw?.practicePlanItems,
  ];
  for (const value of candidates) {
    if (Array.isArray(value)) return value as PracticePlanItem[];
  }
  return undefined;
}

function normalizePlan(raw: any): PracticePlan {
  const items = normalizePlanItems(raw);

  return {
    id: raw?.id ?? "",
    org_id:
      typeof raw?.org_id === "string"
        ? raw.org_id
        : typeof raw?.orgId === "string"
          ? raw.orgId
          : null,
    owner_user_id:
      typeof raw?.owner_user_id === "string"
        ? raw.owner_user_id
        : typeof raw?.ownerUserId === "string"
          ? raw.ownerUserId
          : typeof raw?.user_id === "string"
            ? raw.user_id
            : null,
    name:
      typeof raw?.name === "string"
        ? raw.name
        : typeof raw?.title === "string"
          ? raw.title
          : "",
    description:
      typeof raw?.description === "string"
        ? raw.description
        : raw?.description === null
          ? null
          : typeof raw?.summary === "string"
            ? raw.summary
            : null,
    visibility: typeof raw?.visibility === "string" ? raw.visibility : null,
    status: typeof raw?.status === "string" ? raw.status : null,
    tags: normalizeTags(raw?.tags ?? raw?.tag_list ?? raw?.plan_tags),
    estimated_minutes: normalizeEstimatedMinutes(
      raw?.estimated_minutes ?? raw?.estimatedMinutes ?? raw?.estimated_min,
    ),
    created_at: raw?.created_at ?? raw?.createdAt ?? "",
    updated_at:
      raw?.updated_at ??
      raw?.updatedAt ??
      raw?.created_at ??
      raw?.createdAt ??
      "",
    ...(items ? { items } : {}),
  };
}

function normalizeInvitedPlan(raw: any): InvitedPlan {
  const plan = normalizePlan(raw);

  const memberRole =
    typeof raw?.member_role === "string"
      ? raw.member_role
      : typeof raw?.memberRole === "string"
        ? raw.memberRole
        : typeof raw?.role === "string"
          ? raw.role
          : null;

  const invitedAt =
    typeof raw?.invited_at === "string"
      ? raw.invited_at
      : typeof raw?.invitedAt === "string"
        ? raw.invitedAt
        : null;

  const invitedBy =
    typeof raw?.invited_by === "string"
      ? raw.invited_by
      : typeof raw?.invitedBy === "string"
        ? raw.invitedBy
        : null;

  return {
    ...plan,
    member_role: memberRole,
    invited_at: invitedAt,
    invited_by: invitedBy,
  };
}

function normalizeCreatePayload(input: CreatePlanInput) {
  if (!input.owner_user_id?.trim()) {
    throw new Error("owner_user_id is required.");
  }

  const name = String(input.name ?? "").trim();
  if (!name) {
    throw new Error("name is required.");
  }
  if (name.length > 200) {
    throw new Error("name must be at most 200 characters.");
  }

  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length < 1) {
    throw new Error("items is required.");
  }

  const payload: Record<string, unknown> = {
    owner_user_id: input.owner_user_id.trim(),
    name,
    tags: normalizeTags(input.tags ?? []),
    items,
  };

  if (input.type !== undefined) {
    const trimmed = String(input.type ?? "").trim();
    if (!trimmed) {
      throw new Error("type is required.");
    }
    payload.type = trimmed;
  }

  if (input.org_id !== undefined) {
    if (input.org_id === null) {
      payload.org_id = null;
    } else {
      const trimmed = String(input.org_id).trim();
      payload.org_id = trimmed ? trimmed : null;
    }
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      payload.description = null;
    } else {
      const trimmed = String(input.description).trim();
      if (trimmed.length > 4000) {
        throw new Error("description must be at most 4000 characters.");
      }
      payload.description = trimmed ? trimmed : null;
    }
  }

  if (input.visibility !== undefined) {
    const trimmed = String(input.visibility).trim();
    if (!trimmed) {
      throw new Error("visibility is required.");
    }
    payload.visibility = trimmed;
  }

  if (input.status !== undefined) {
    const trimmed = String(input.status).trim();
    if (!trimmed) {
      throw new Error("status is required.");
    }
    payload.status = trimmed;
  }

  const estimated = normalizeNullableInteger(
    input.estimated_minutes,
    "estimated_minutes",
  );
  if (estimated !== undefined) {
    payload.estimated_minutes = estimated;
  }

  return payload;
}

function normalizeUpdatePayload(input: UpdatePlanInput) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const trimmed = String(input.name ?? "").trim();
    if (!trimmed) {
      throw new Error("name is required.");
    }
    if (trimmed.length > 200) {
      throw new Error("name must be at most 200 characters.");
    }
    payload.name = trimmed;
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      payload.description = null;
    } else {
      const trimmed = String(input.description).trim();
      if (trimmed.length > 4000) {
        throw new Error("description must be at most 4000 characters.");
      }
      payload.description = trimmed ? trimmed : null;
    }
  }

  if (input.visibility !== undefined) {
    if (input.visibility === null) {
      throw new Error("visibility cannot be null.");
    }
    const trimmed = String(input.visibility).trim();
    if (!trimmed) {
      throw new Error("visibility is required.");
    }
    payload.visibility = trimmed;
  }

  if (input.status !== undefined) {
    if (input.status === null) {
      throw new Error("status cannot be null.");
    }
    const trimmed = String(input.status).trim();
    if (!trimmed) {
      throw new Error("status is required.");
    }
    payload.status = trimmed;
  }

  if (input.tags !== undefined) {
    payload.tags = normalizeTags(input.tags);
  }

  if (input.estimated_minutes !== undefined) {
    const estimated = normalizeNullableInteger(
      input.estimated_minutes,
      "estimated_minutes",
    );
    payload.estimated_minutes = estimated ?? null;
  }

  if (input.org_id !== undefined) {
    if (input.org_id === null) {
      payload.org_id = null;
    } else {
      const trimmed = String(input.org_id).trim();
      payload.org_id = trimmed ? trimmed : null;
    }
  }

  const addItems = Array.isArray(input.add_items) ? input.add_items : [];
  const removeItemIds = normalizeStringArray(input.remove_item_ids);

  payload.add_items = addItems;
  payload.remove_item_ids = removeItemIds;

  return payload;
}

function normalizeInvitePayload(input: InvitePlanInput) {
  const userIds = normalizeStringArray(input.user_ids);
  if (userIds.length < 1) {
    throw new Error("user_ids is required.");
  }

  const payload: Record<string, unknown> = {
    user_ids: userIds,
  };

  if (input.added_by !== undefined) {
    if (input.added_by === null) {
      payload.added_by = null;
    } else {
      const trimmed = String(input.added_by).trim();
      if (!trimmed) {
        throw new Error("added_by cannot be empty.");
      }
      payload.added_by = trimmed;
    }
  }

  return payload;
}

function buildListQuery(filter: PlanListFilter) {
  const params = new URLSearchParams();
  const type = String(filter.type ?? "").trim();

  if (!type) {
    throw new Error("type is required.");
  }

  if ((type === "custom-plans" || type === "custom") && !filter.user_id?.trim()) {
    throw new Error("user_id (UUID) is required for type=custom/custom-plans");
  }

  params.set("type", type);
  if (filter.user_id?.trim()) params.set("user_id", filter.user_id.trim());

  const limit = normalizeLimit(filter.limit);
  const offset = normalizeOffset(filter.offset);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return params.toString();
}

function normalizeCount(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * GET /functions/v1/api/plans/invited?user_id=<uuid>
 */
export async function listInvited(
  params: ListInvitedPlansParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: InvitedPlan[]; count?: number }> {
  if (!params?.user_id?.trim()) {
    throw new Error("user_id (UUID) is required for invited plans.");
  }

  const sp = new URLSearchParams();
  sp.set("user_id", params.user_id.trim());

  const limit = normalizeLimit(params.limit);
  const offset = normalizeOffset(params.offset);
  sp.set("limit", String(limit));
  sp.set("offset", String(offset));

  const url = `${baseUrl}/functions/v1/api/plans/invited?${sp.toString()}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PlansListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load invited plans.");
  }

  const rawItems = (data.items ?? (data as any).plans ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeInvitedPlan(item));
  const count = normalizeCount((data as any)?.count);

  return { items, count };
}

/**
 * GET /functions/v1/api/practice-plans/list
 */
export async function listPlansByType(
  filter: PlanListFilter,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: PracticePlan[]; count?: number }> {
  const qs = buildListQuery(filter);
  const url = `${baseUrl}/functions/v1/api/plans/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: filter.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PlansListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load plans.");
  }

  const rawItems = (data.items ?? (data as any).plans ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizePlan(item));
  const count = normalizeCount((data as any)?.count);

  return { items, count };
}

/**
 * GET /functions/v1/api/practice-plans/:id
 */
export async function getPlanById(
  planId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<PracticePlan> {
  if (!planId?.trim()) {
    throw new Error("planId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/plans/${planId}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PlanDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load plan.");
  }

  const raw = (data as any)?.plan ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from plan detail endpoint.");
  }

  return normalizePlan(raw);
}

/**
 * POST /functions/v1/api/practice-plans
 */
export async function createPlan(
  input: CreatePlanInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<PracticePlan> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/plans`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PlanDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to create plan.");
  }

  const raw = (data as any)?.plan ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from plan create endpoint.");
  }

  return normalizePlan(raw);
}

/**
 * PATCH /functions/v1/api/practice-plans/:id
 */
export async function updatePlan(
  planId: string,
  input: UpdatePlanInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<PracticePlan> {
  if (!planId?.trim()) {
    throw new Error("planId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/plans/${planId}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | PlanDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update plan.");
  }

  const raw = (data as any)?.plan ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from plan update endpoint.");
  }

  return normalizePlan(raw);
}

/**
 * POST /functions/v1/api/plans/:id/invite?org_id=<uuid>
 */
export async function invitePlanUsers(
  planId: string,
  org_id: string,
  input: InvitePlanInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<InvitePlanResult> {
  if (!planId?.trim()) {
    throw new Error("planId is required.");
  }
  if (!org_id?.trim()) {
    throw new Error("org_id is required.");
  }

  const payload = normalizeInvitePayload(input);
  const sp = new URLSearchParams();
  sp.set("org_id", org_id.trim());

  const url = `${baseUrl}/functions/v1/api/plans/${planId}/invite?${sp.toString()}`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: org_id,
  });

  const data = (await res.json().catch(() => undefined)) as
    | InvitePlanResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to invite plan users.");
  }

  return {
    plan_id:
      typeof (data as any)?.plan_id === "string" ? (data as any).plan_id : planId,
    invited_user_ids: normalizeStringArray((data as any)?.invited_user_ids),
    skipped_user_ids: normalizeStringArray((data as any)?.skipped_user_ids),
  };
}
