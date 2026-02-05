// src/services/scorecardService.ts
// Pure fetch wrappers to call your Deno edge functions under /functions/v1/api/scorecard/*
// Mirrors the style of signupService.ts / skillsService.ts / teamsService.ts
// (typed, no Supabase client here).

import { apiFetch } from '../../../shared/api/apiClient'

// ---------------------------------------------------------------------
// Creation inputs (same as before)
// ---------------------------------------------------------------------

export type ScorecardSubskillInput = {
  name: string;
  description?: string | null;
  position?: number;
  /** REQUIRED: canonical Skill UUID */
  skill_id: string;
};

export type ScorecardCategoryInput = {
  name: string;
  description?: string | null;
  position?: number;
  subskills: ScorecardSubskillInput[];
};

export type CreateScorecardTemplateInput = {
  /** Only needed when calling without a Bearer JWT (e.g. server/service-role context) */
  createdBy?: string;
  org_id: string;
  sport_id?: string | null;
  name: string;
  description?: string | null;
  isActive?: boolean;
  categories: ScorecardCategoryInput[];
};

export type CreateScorecardTemplateResponse =
  | { ok: true; templateId?: string }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertInput(i: CreateScorecardTemplateInput) {
  if (!i.org_id?.trim()) throw new Error("org_id is required.");
  if (!i.name?.trim()) throw new Error("Template name is required.");
  if (!Array.isArray(i.categories) || i.categories.length === 0) {
    throw new Error("At least one category is required.");
  }

  i.categories.forEach((c, ci) => {
    if (!c?.name?.trim()) {
      throw new Error(`Category[${ci}]: name is required.`);
    }
    if (!Array.isArray(c.subskills) || c.subskills.length === 0) {
      throw new Error(`Category[${ci}]: at least one subskill is required.`);
    }
    c.subskills.forEach((s, si) => {
      if (!s?.name?.trim()) {
        throw new Error(
          `Category[${ci}] Subskill[${si}]: name is required.`,
        );
      }
      if (!s?.skill_id?.trim()) {
        throw new Error(
          `Category[${ci}] Subskill[${si}]: skill_id is required.`,
        );
      }
      if (!UUID_RE.test(s.skill_id)) {
        throw new Error(
          `Category[${ci}] Subskill[${si}]: skill_id must be a UUID.`,
        );
      }
    });
  });
}

function normalizePayload(input: CreateScorecardTemplateInput) {
  const normCategories = input.categories.map((c, ci) => ({
    name: c.name.trim(),
    description: c.description ?? null,
    position: Number.isFinite(c.position) ? Number(c.position) : ci + 1,
    subskills: c.subskills.map((s, si) => ({
      name: s.name.trim(),
      description: s.description ?? null,
      position: Number.isFinite(s.position) ? Number(s.position) : si + 1,
      skill_id: s.skill_id.trim(),
    })),
  }));

  return {
    createdBy: input.createdBy, // optional; backend can use auth.uid() if JWT present
    org_id: input.org_id.trim(),
    sport_id: input.sport_id ?? null,
    name: input.name.trim(),
    description: input.description ?? null,
    isActive: input.isActive ?? true,
    categories: normCategories,
  };
}

// ---------------------------------------------------------------------
// List types + union response envelopes
// ---------------------------------------------------------------------

export type ScorecardTemplateRow = {
  id: string;
  org_id: string;
  sport_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type ScorecardCategory = {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
};

export type ScorecardSubskill = {
  id: string;
  category_id: string;
  skill_id: string | null;
  name: string;
  description: string | null;
  position: number;
  rating_min: number;
  rating_max: number;
  created_at: string;
};

export type ScorecardTemplatesListResponse =
  | {
      ok: true;
      count?: number;
      items?: ScorecardTemplateRow[];
      data?: ScorecardTemplateRow[];
    }
  | { ok: false; error: string };

export type ScorecardCategoriesListResponse =
  | {
      ok: true;
      count?: number;
      items?: ScorecardCategory[];
      data?: ScorecardCategory[];
    }
  | { ok: false; error: string };

export type ScorecardSubskillsListResponse =
  | {
      ok: true;
      count?: number;
      items?: ScorecardSubskill[];
      data?: ScorecardSubskill[];
    }
  | { ok: false; error: string };

// ---------------------------------------------------------------------
// Helpers for queries + labels
// ---------------------------------------------------------------------

export type ListScorecardTemplatesParams = {
  orgId: string;            // required
  sportId?: string | null;  // optional
  q?: string | null;        // optional search
  limit?: number;           // optional, let backend default if omitted
  offset?: number;          // optional, let backend default if omitted
};

export type ListScorecardCategoriesByTemplateParams = {
  scorecardTemplateId: string; // required
  limit?: number;
  offset?: number;
  orgId?: string | null;
};

export type ListScorecardSubskillsByCategoryParams = {
  categoryId: string; // required
  limit?: number;
  offset?: number;
  orgId?: string | null;
};

function buildTemplatesQuery(params: ListScorecardTemplatesParams) {
  const u = new URLSearchParams();
  if (params.orgId?.trim()) u.set("org_id", params.orgId.trim());
  if (params.sportId?.trim()) u.set("sport_id", params.sportId.trim());
  if (params.q?.trim()) u.set("q", params.q.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function buildCategoriesQuery(params: ListScorecardCategoriesByTemplateParams) {
  const u = new URLSearchParams();
  if (params.scorecardTemplateId?.trim()) {
    u.set("scorecard_template_id", params.scorecardTemplateId.trim());
  }
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function buildSubskillsQuery(params: ListScorecardSubskillsByCategoryParams) {
  const u = new URLSearchParams();
  if (params.categoryId?.trim()) u.set("category_id", params.categoryId.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

const DEFAULT_BASE_URL = "http://localhost:8000";

function resolveBaseUrl() {
  if (typeof import.meta === "undefined") return DEFAULT_BASE_URL;
  const env = (import.meta as any).env ?? {};
  return (env.VITE_ORG_SIGNUP_URL || env.VITE_BACKEND_URL || DEFAULT_BASE_URL) as string;
}

// Small helpers if you want consistent labels in the UI
export function scorecardTemplateLabel(t: ScorecardTemplateRow) {
  return t.name;
}

export function scorecardCategoryLabel(c: ScorecardCategory) {
  return c.name;
}

// ---------------------------------------------------------------------
// createScorecardTemplate
// POST /functions/v1/api/scorecard
// ---------------------------------------------------------------------

/**
 * Calls your local backend to create a scorecard template (transactional).
 * Defaults to http://localhost:8000; override with VITE_ORG_SIGNUP_URL or VITE_BACKEND_URL if desired.
 */
export async function createScorecardTemplate(
  input: CreateScorecardTemplateInput,
  baseUrl = resolveBaseUrl(),
): Promise<CreateScorecardTemplateResponse> {
  // Basic client-side validation to avoid obvious round-trips
  assertInput(input);

  const payload = normalizePayload(input);

  const url = `${baseUrl}/functions/v1/api/scorecard`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  // Try to parse JSON either way to surface backend error messages
  const data = (await res.json().catch(() => undefined)) as
    | CreateScorecardTemplateResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(`Create template failed: ${reason}`);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Create template failed.");
  }

  return data;
}

// Optional builders for form code
export function makeCategory(params: {
  name: string;
  description?: string | null;
  position?: number;
  subskills: ScorecardSubskillInput[];
}): ScorecardCategoryInput {
  return { ...params };
}

export function makeSubskill(params: {
  name: string;
  skill_id: string;
  description?: string | null;
  position?: number;
}): ScorecardSubskillInput {
  return { ...params };
}

// ---------------------------------------------------------------------
// listScorecardTemplates
// GET /functions/v1/api/scorecard/list?org_id=...&sport_id=...&q=...&limit=...&offset=...
// ---------------------------------------------------------------------

/**
 * Fetch scorecard templates for an org (optionally by sport / search term).
 *
 * Returns a plain array of ScorecardTemplateRow items.
 */
export async function listScorecardTemplates(
  params: ListScorecardTemplatesParams,
  baseUrl = resolveBaseUrl(),
): Promise<ScorecardTemplateRow[]> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildTemplatesQuery(params);
  const url =
    qs.length > 0
      ? `${baseUrl}/functions/v1/api/scorecard/list?${qs}`
      : `${baseUrl}/functions/v1/api/scorecard/list`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  let data: ScorecardTemplatesListResponse | undefined;
  try {
    data = (await res.json()) as ScorecardTemplatesListResponse;
  } catch {
    data = undefined;
  }
  console.log("listScorecardTemplates response data:", data);

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }

  if (!data || (data as any).ok !== true) {
    throw new Error((data as any)?.error || "Failed to load scorecard templates.");
  }

  const items =
    (data as any).items ??
    (data as any).data ??
    [];
  console.log(`Items loaded: ${JSON.stringify(items)}`);
  return Array.isArray(items) ? (items as ScorecardTemplateRow[]) : [];
}

// ---------------------------------------------------------------------
// listScorecardCategoriesByTemplate
// GET /functions/v1/api/scorecard/categories?scorecard_template_id=...&limit=...&offset=...
// ---------------------------------------------------------------------

/**
 * Fetch categories for a given scorecard template.
 *
 * Returns a plain array of ScorecardCategory items.
 */
export async function listScorecardCategoriesByTemplate(
  params: ListScorecardCategoriesByTemplateParams,
  baseUrl = resolveBaseUrl(),
): Promise<ScorecardCategory[]> {
  if (!params.scorecardTemplateId?.trim()) {
    throw new Error("scorecardTemplateId is required.");
  }
  console.log(`baseUrl: ${baseUrl}, params: ${JSON.stringify(params)}`);
  const qs = buildCategoriesQuery(params);
  const url = `${baseUrl}/functions/v1/api/scorecard/categories?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | ScorecardCategoriesListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to load scorecard categories.");
  }

  // Support both { items: [...] } and { data: [...] } payloads
  return (data.items ?? (data as any).data ?? []) as ScorecardCategory[];
}

// ---------------------------------------------------------------------
// listScorecardSubskillsByCategory
// GET /functions/v1/api/scorecard/subskills?category_id=...&limit=...&offset=...
// ---------------------------------------------------------------------

/**
 * Fetch subskills for a given scorecard category.
 *
 * Returns a plain array of ScorecardSubskill items.
 */
export async function listScorecardSubskillsByCategory(
  params: ListScorecardSubskillsByCategoryParams,
  baseUrl = resolveBaseUrl(),
): Promise<ScorecardSubskill[]> {
  if (!params.categoryId?.trim()) {
    throw new Error("categoryId is required.");
  }

  const qs = buildSubskillsQuery(params);
  const url = `${baseUrl}/functions/v1/api/scorecard/subskills?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });
  const data = (await res.json().catch(() => undefined)) as
    | ScorecardSubskillsListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to load scorecard subskills.");
  }

  // Support both { items: [...] } and { data: [...] } payloads
  return (data.items ?? (data as any).data ?? []) as ScorecardSubskill[];
}
