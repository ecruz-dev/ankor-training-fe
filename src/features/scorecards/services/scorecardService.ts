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

export type ScorecardSubskillAddInput = {
  category_id: string;
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

export type UpdateScorecardTemplateInput = {
  org_id?: string | null;
  sport_id?: string | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  add_categories?: ScorecardCategoryInput[];
  remove_category_ids?: string[];
  add_subskills?: ScorecardSubskillAddInput[];
  remove_subskill_ids?: string[];
};

export type UpdateScorecardTemplateResponse =
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

function normalizeUuidList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed || !UUID_RE.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function normalizeUpdatePayload(input: UpdateScorecardTemplateInput) {
  const payload: Record<string, unknown> = {};

  if (input.org_id !== undefined) {
    if (input.org_id === null) {
      payload.org_id = null;
    } else {
      const trimmed = String(input.org_id).trim();
      payload.org_id = trimmed ? trimmed : null;
    }
  }

  if (input.sport_id !== undefined) {
    if (input.sport_id === null) {
      payload.sport_id = null;
    } else {
      const trimmed = String(input.sport_id).trim();
      payload.sport_id = trimmed ? trimmed : null;
    }
  }

  if (input.name !== undefined) {
    const trimmed = String(input.name ?? "").trim();
    if (!trimmed) throw new Error("Template name is required.");
    payload.name = trimmed;
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      payload.description = null;
    } else {
      const trimmed = String(input.description ?? "").trim();
      payload.description = trimmed ? trimmed : null;
    }
  }

  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }

  if (input.add_categories !== undefined) {
    if (!Array.isArray(input.add_categories)) {
      throw new Error("add_categories must be an array.");
    }

    payload.add_categories = input.add_categories.map((category, ci) => {
      if (!category?.name?.trim()) {
        throw new Error(`Category[${ci}]: name is required.`);
      }

      const subskills = (category.subskills ?? []).map((s, si) => {
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

        return {
          name: s.name.trim(),
          description: s.description ?? null,
          position: Number.isFinite(s.position) ? Number(s.position) : si + 1,
          skill_id: s.skill_id.trim(),
        };
      });

      return {
        name: category.name.trim(),
        description: category.description ?? null,
        position: Number.isFinite(category.position)
          ? Number(category.position)
          : ci + 1,
        subskills,
      };
    });
  }

  if (input.remove_category_ids !== undefined) {
    payload.remove_category_ids = normalizeUuidList(input.remove_category_ids);
  }

  if (input.add_subskills !== undefined) {
    if (!Array.isArray(input.add_subskills)) {
      throw new Error("add_subskills must be an array.");
    }

    payload.add_subskills = input.add_subskills.map((subskill, si) => {
      if (!subskill?.category_id?.trim()) {
        throw new Error(`Subskill[${si}]: category_id is required.`);
      }
      if (!UUID_RE.test(subskill.category_id)) {
        throw new Error(`Subskill[${si}]: category_id must be a UUID.`);
      }
      if (!subskill?.name?.trim()) {
        throw new Error(`Subskill[${si}]: name is required.`);
      }
      if (!subskill?.skill_id?.trim()) {
        throw new Error(`Subskill[${si}]: skill_id is required.`);
      }
      if (!UUID_RE.test(subskill.skill_id)) {
        throw new Error(`Subskill[${si}]: skill_id must be a UUID.`);
      }

      return {
        category_id: subskill.category_id.trim(),
        name: subskill.name.trim(),
        description: subskill.description ?? null,
        position: Number.isFinite(subskill.position)
          ? Number(subskill.position)
          : si + 1,
        skill_id: subskill.skill_id.trim(),
      };
    });
  }

  if (input.remove_subskill_ids !== undefined) {
    payload.remove_subskill_ids = normalizeUuidList(input.remove_subskill_ids);
  }

  return payload;
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
  created_by: string | null;
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

export type ScorecardTemplateDetailResponse =
  | {
      ok: true;
      item?: any;
      template?: ScorecardTemplateRow;
      categories?: ScorecardCategory[];
      subskills?: ScorecardSubskill[];
      data?: any;
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

function normalizeTemplateRow(raw: any): ScorecardTemplateRow | null {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw?.id ??
    raw?.template_id ??
    raw?.scorecard_template_id ??
    raw?.scorecardTemplateId;
  if (!id || typeof id !== "string") return null;

  const orgId =
    typeof raw?.org_id === "string"
      ? raw.org_id
      : typeof raw?.orgId === "string"
        ? raw.orgId
        : "";

  const sportId =
    typeof raw?.sport_id === "string"
      ? raw.sport_id
      : typeof raw?.sportId === "string"
        ? raw.sportId
        : null;

  const createdBy =
    typeof raw?.created_by === "string"
      ? raw.created_by
      : typeof raw?.createdBy === "string"
        ? raw.createdBy
        : null;

  const createdAt =
    typeof raw?.created_at === "string"
      ? raw.created_at
      : typeof raw?.createdAt === "string"
        ? raw.createdAt
        : "";

  const updatedAt =
    typeof raw?.updated_at === "string"
      ? raw.updated_at
      : typeof raw?.updatedAt === "string"
        ? raw.updatedAt
        : null;

  const isActiveRaw =
    typeof raw?.is_active === "boolean"
      ? raw.is_active
      : typeof raw?.isActive === "boolean"
        ? raw.isActive
        : typeof raw?.active === "boolean"
          ? raw.active
          : true;

  return {
    id,
    org_id: orgId,
    sport_id: sportId,
    name: String(raw?.name ?? raw?.title ?? ""),
    description:
      typeof raw?.description === "string"
        ? raw.description
        : raw?.description === null
          ? null
          : null,
    is_active: Boolean(isActiveRaw),
    created_by: createdBy,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizeCategoryRow(raw: any, templateId: string): ScorecardCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw?.id ??
    raw?.category_id ??
    raw?.categoryId;
  if (!id || typeof id !== "string") return null;

  const tplId =
    typeof raw?.template_id === "string"
      ? raw.template_id
      : typeof raw?.scorecard_template_id === "string"
        ? raw.scorecard_template_id
        : typeof raw?.templateId === "string"
          ? raw.templateId
          : templateId;

  return {
    id,
    template_id: tplId,
    name: String(raw?.name ?? raw?.title ?? ""),
    description:
      typeof raw?.description === "string"
        ? raw.description
        : raw?.description === null
          ? null
          : null,
    position: Number.isFinite(Number(raw?.position)) ? Number(raw.position) : 0,
    created_at:
      typeof raw?.created_at === "string"
        ? raw.created_at
        : typeof raw?.createdAt === "string"
          ? raw.createdAt
          : "",
  };
}

function normalizeSubskillRow(raw: any, categoryIdFallback: string): ScorecardSubskill | null {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw?.id ??
    raw?.subskill_id ??
    raw?.subskillId;
  if (!id || typeof id !== "string") return null;

  const categoryId =
    typeof raw?.category_id === "string"
      ? raw.category_id
      : typeof raw?.categoryId === "string"
        ? raw.categoryId
        : categoryIdFallback;

  const skillId =
    typeof raw?.skill_id === "string"
      ? raw.skill_id
      : typeof raw?.skillId === "string"
        ? raw.skillId
        : null;

  return {
    id,
    category_id: categoryId,
    skill_id: skillId,
    name: String(raw?.name ?? raw?.title ?? ""),
    description:
      typeof raw?.description === "string"
        ? raw.description
        : raw?.description === null
          ? null
          : null,
    position: Number.isFinite(Number(raw?.position)) ? Number(raw.position) : 0,
    rating_min: Number.isFinite(Number(raw?.rating_min))
      ? Number(raw.rating_min)
      : 1,
    rating_max: Number.isFinite(Number(raw?.rating_max))
      ? Number(raw.rating_max)
      : 5,
    created_at:
      typeof raw?.created_at === "string"
        ? raw.created_at
        : typeof raw?.createdAt === "string"
          ? raw.createdAt
          : "",
  };
}

function normalizeScorecardDetail(raw: any) {
  const root =
    raw?.item ??
    (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)
      ? raw.data
      : raw);

  const templateCandidate =
    raw?.item ??
    raw?.template ??
    raw?.scorecard_template ??
    root?.template ??
    root?.scorecard_template ??
    root?.scorecard ??
    root;

  const template = normalizeTemplateRow(templateCandidate);

  const templateId = template?.id ?? "";

  let categoriesRaw =
    root?.categories ??
    root?.scorecard_categories ??
    root?.scorecardCategories ??
    root?.template_categories ??
    root?.templateCategories ??
    (Array.isArray(root) ? root : []);

  if (
    (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) &&
    Array.isArray((templateCandidate as any)?.categories)
  ) {
    categoriesRaw = (templateCandidate as any).categories;
  }

  const categories: ScorecardCategory[] = Array.isArray(categoriesRaw)
    ? categoriesRaw
        .map((cat: any) => normalizeCategoryRow(cat, templateId))
        .filter((cat: any): cat is ScorecardCategory => Boolean(cat))
    : [];

  let subskillsRaw =
    root?.subskills ??
    root?.scorecard_subskills ??
    root?.scorecardSubskills ??
    root?.template_subskills ??
    root?.templateSubskills ??
    [];

  if (
    (!Array.isArray(subskillsRaw) || subskillsRaw.length === 0) &&
    Array.isArray((templateCandidate as any)?.subskills)
  ) {
    subskillsRaw = (templateCandidate as any).subskills;
  }

  const subskillMap = new Map<string, ScorecardSubskill>();

  const pushSubskill = (sub: ScorecardSubskill | null) => {
    if (!sub) return;
    if (!subskillMap.has(sub.id)) {
      subskillMap.set(sub.id, sub);
    }
  };

  if (Array.isArray(subskillsRaw)) {
    subskillsRaw.forEach((sub: any) => {
      const normalized = normalizeSubskillRow(sub, "");
      pushSubskill(normalized);
    });
  }

  if (Array.isArray(categoriesRaw)) {
    categoriesRaw.forEach((cat: any) => {
      const catId =
        typeof cat?.id === "string"
          ? cat.id
          : typeof cat?.category_id === "string"
            ? cat.category_id
            : "";
      const nestedSubskills =
        cat?.scorecard_subskills ??
        cat?.subskills ??
        cat?.skills ??
        [];
      if (!Array.isArray(nestedSubskills)) return;
      nestedSubskills.forEach((sub: any) => {
        const normalized = normalizeSubskillRow(sub, catId);
        pushSubskill(normalized);
      });
    });
  }

  return {
    template,
    categories,
    subskills: Array.from(subskillMap.values()),
  };
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

// ---------------------------------------------------------------------
// updateScorecardTemplate
// PATCH /functions/v1/api/scorecard/:id
// ---------------------------------------------------------------------

/**
 * Updates a scorecard template, including categories and subskills.
 */
export async function updateScorecardTemplate(
  templateId: string,
  input: UpdateScorecardTemplateInput,
  baseUrl = resolveBaseUrl(),
): Promise<UpdateScorecardTemplateResponse> {
  if (!templateId?.trim()) {
    throw new Error("templateId is required.");
  }

  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/scorecard/${templateId}/`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: input.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateScorecardTemplateResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(`Update template failed: ${reason}`);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Update template failed.");
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

// ---------------------------------------------------------------------
// getScorecardTemplateDetail
// GET /functions/v1/api/scorecard/:id
// ---------------------------------------------------------------------

/**
 * Fetch full scorecard template detail (template + categories + subskills).
 */
export async function getScorecardTemplateDetail(
  templateId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<{
  template: ScorecardTemplateRow | null;
  categories: ScorecardCategory[];
  subskills: ScorecardSubskill[];
}> {
  if (!templateId?.trim()) {
    throw new Error("templateId is required.");
  }

  const { orgId = null, baseUrl = resolveBaseUrl() } = options;
  const url = `${baseUrl}/functions/v1/api/scorecard/${templateId}/`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | ScorecardTemplateDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to load scorecard template.");
  }

  const normalized = normalizeScorecardDetail(data);
  return normalized;
}
