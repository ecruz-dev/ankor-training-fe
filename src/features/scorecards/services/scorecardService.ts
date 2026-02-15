import { apiFetch } from "../../../shared/api/apiClient";

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

export type ScorecardTemplateRow = {
  id: string;
  org_id: string;
  sport_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ScorecardCategory = {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at?: string | null;
};

export type ScorecardSubskillRow = {
  id: string;
  category_id: string;
  skill_id: string | null;
  name: string;
  description: string | null;
  position: number;
  rating_min: number;
  rating_max: number;
  created_at?: string | null;
};

export type ScorecardListResponse =
  | { ok: true; count?: number; items?: unknown[]; data?: unknown[] }
  | { ok: false; error: string };

export type ScorecardDetailResponse =
  | {
      ok: true;
      template?: unknown;
      item?: unknown;
      data?: unknown;
      categories?: unknown[];
      subskills?: unknown[];
      scorecard_categories?: unknown[];
      scorecard_subskills?: unknown[];
    }
  | { ok: false; error: string };

export type ListScorecardTemplatesParams = {
  orgId: string;
  sportId?: string | null;
  q?: string;
  limit?: number;
  offset?: number;
};

export type ListScorecardCategoriesParams = {
  scorecardTemplateId: string;
  orgId?: string | null;
  limit?: number;
  offset?: number;
};

export type ListScorecardSubskillsParams = {
  categoryId: string;
  orgId?: string | null;
  limit?: number;
  offset?: number;
};

export type ScorecardTemplateDetail = {
  template: ScorecardTemplateRow | null;
  categories: ScorecardCategory[];
  subskills: ScorecardSubskillRow[];
};

export type UpdateScorecardTemplateInput = {
  org_id: string;
  sport_id?: string | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  add_categories?: Array<{
    name: string;
    description?: string | null;
    position?: number;
    subskills?: Array<{
      name: string;
      description?: string | null;
      position?: number;
      skill_id: string;
      rating_min?: number;
      rating_max?: number;
      priority?: number;
    }>;
  }>;
  remove_category_ids?: string[];
  add_subskills?: Array<{
    category_id: string;
    name: string;
    description?: string | null;
    position?: number;
    skill_id: string;
    rating_min?: number;
    rating_max?: number;
    priority?: number;
  }>;
  remove_subskill_ids?: string[];
};

export type UpdateScorecardTemplateResponse =
  | {
      ok: true;
      added_category_ids?: string[];
      removed_category_ids?: string[];
      added_subskill_ids?: string[];
      removed_subskill_ids?: string[];
    }
  | { ok: false; error: string };

function normalizeTemplate(raw: any): ScorecardTemplateRow {
  const isActiveRaw = raw?.is_active ?? raw?.isActive ?? raw?.active;
  const is_active =
    typeof isActiveRaw === "boolean"
      ? isActiveRaw
      : isActiveRaw == null
        ? true
        : Boolean(isActiveRaw);

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : "",
    sport_id: typeof raw?.sport_id === "string" ? raw.sport_id : null,
    name:
      typeof raw?.name === "string"
        ? raw.name
        : typeof raw?.title === "string"
          ? raw.title
          : "",
    description: typeof raw?.description === "string" ? raw.description : null,
    is_active,
    created_by: typeof raw?.created_by === "string" ? raw.created_by : null,
    created_at:
      typeof raw?.created_at === "string"
        ? raw.created_at
        : typeof raw?.createdAt === "string"
          ? raw.createdAt
          : "",
    updated_at:
      typeof raw?.updated_at === "string"
        ? raw.updated_at
        : typeof raw?.updatedAt === "string"
          ? raw.updatedAt
          : null,
  };
}

function normalizeCategory(raw: any, templateId = ""): ScorecardCategory {
  const id =
    typeof raw?.id === "string"
      ? raw.id
      : typeof raw?.category_id === "string"
        ? raw.category_id
        : "";
  const template_id =
    typeof raw?.template_id === "string"
      ? raw.template_id
      : typeof raw?.scorecard_template_id === "string"
        ? raw.scorecard_template_id
        : typeof raw?.templateId === "string"
          ? raw.templateId
          : templateId;

  return {
    id,
    template_id,
    name:
      typeof raw?.name === "string"
        ? raw.name
        : typeof raw?.title === "string"
          ? raw.title
          : "",
    description: typeof raw?.description === "string" ? raw.description : null,
    position: Number.isFinite(Number(raw?.position)) ? Number(raw.position) : 0,
    created_at:
      typeof raw?.created_at === "string"
        ? raw.created_at
        : typeof raw?.createdAt === "string"
          ? raw.createdAt
          : null,
  };
}

function normalizeSubskill(raw: any, categoryId = ""): ScorecardSubskillRow {
  const id =
    typeof raw?.id === "string"
      ? raw.id
      : typeof raw?.subskill_id === "string"
        ? raw.subskill_id
        : "";
  const category_id =
    typeof raw?.category_id === "string"
      ? raw.category_id
      : typeof raw?.categoryId === "string"
        ? raw.categoryId
        : categoryId;
  const skill_id =
    typeof raw?.skill_id === "string"
      ? raw.skill_id
      : typeof raw?.skillId === "string"
        ? raw.skillId
        : null;

  return {
    id,
    category_id,
    skill_id,
    name:
      typeof raw?.name === "string"
        ? raw.name
        : typeof raw?.title === "string"
          ? raw.title
          : "",
    description: typeof raw?.description === "string" ? raw.description : null,
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
          : null,
  };
}

function buildScorecardListQuery(params: ListScorecardTemplatesParams) {
  const search = new URLSearchParams();
  if (params.orgId?.trim()) search.set("org_id", params.orgId.trim());
  if (params.sportId?.trim()) search.set("sport_id", params.sportId.trim());
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (Number.isFinite(params.limit)) search.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) search.set("offset", String(params.offset));
  return search.toString();
}

function buildCategoriesQuery(params: ListScorecardCategoriesParams) {
  const search = new URLSearchParams();
  if (params.scorecardTemplateId?.trim()) {
    search.set("scorecard_template_id", params.scorecardTemplateId.trim());
  }
  if (Number.isFinite(params.limit)) search.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) search.set("offset", String(params.offset));
  return search.toString();
}

function buildSubskillsQuery(params: ListScorecardSubskillsParams) {
  const search = new URLSearchParams();
  if (params.categoryId?.trim()) {
    search.set("category_id", params.categoryId.trim());
  }
  if (Number.isFinite(params.limit)) search.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) search.set("offset", String(params.offset));
  return search.toString();
}

function normalizeDetailPayload(payload: any): ScorecardTemplateDetail {
  if (!payload || typeof payload !== "object") {
    return { template: null, categories: [], subskills: [] };
  }

  const root =
    payload.item ??
    payload.data ??
    payload.scorecard ??
    payload.scorecard_template ??
    payload;

  const templateRaw =
    payload.template ??
    root?.template ??
    root?.scorecard_template ??
    root?.scorecard ??
    root;

  const template = templateRaw ? normalizeTemplate(templateRaw) : null;
  const templateId = template?.id ?? "";

  let categoriesRaw =
    root?.categories ??
    root?.scorecard_categories ??
    root?.scorecardCategories ??
    root?.template_categories ??
    root?.templateCategories ??
    payload.categories ??
    payload.scorecard_categories ??
    [];

  if ((!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) && Array.isArray(templateRaw?.categories)) {
    categoriesRaw = templateRaw.categories;
  }

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
        .map((item) => normalizeCategory(item, templateId))
        .filter((c) => c.id)
    : [];

  let subskillsRaw =
    root?.subskills ??
    root?.scorecard_subskills ??
    root?.scorecardSubskills ??
    root?.template_subskills ??
    root?.templateSubskills ??
    payload.subskills ??
    payload.scorecard_subskills ??
    [];

  if ((!Array.isArray(subskillsRaw) || subskillsRaw.length === 0) && Array.isArray(templateRaw?.subskills)) {
    subskillsRaw = templateRaw.subskills;
  }

  const subskillMap = new Map<string, ScorecardSubskillRow>();

  if (Array.isArray(subskillsRaw)) {
    subskillsRaw.forEach((item) => {
      const normalized = normalizeSubskill(item, "");
      if (!normalized.id || subskillMap.has(normalized.id)) return;
      subskillMap.set(normalized.id, normalized);
    });
  }

  if (Array.isArray(categoriesRaw)) {
    categoriesRaw.forEach((cat) => {
      const categoryId =
        typeof cat?.id === "string"
          ? cat.id
          : typeof cat?.category_id === "string"
            ? cat.category_id
            : "";
      const nested =
        cat?.scorecard_subskills ?? cat?.subskills ?? cat?.skills ?? [];
      if (!Array.isArray(nested)) return;
      nested.forEach((item: any) => {
        const normalized = normalizeSubskill(item, categoryId);
        if (!normalized.id || subskillMap.has(normalized.id)) return;
        subskillMap.set(normalized.id, normalized);
      });
    });
  }

  return {
    template,
    categories,
    subskills: Array.from(subskillMap.values()),
  };
}

function normalizeUpdatePayload(input: UpdateScorecardTemplateInput) {
  if (!input.org_id?.trim()) {
    throw new Error("org_id is required.");
  }

  const payload: Record<string, unknown> = {
    org_id: input.org_id.trim(),
  };

  if (input.sport_id !== undefined) {
    const trimmed = String(input.sport_id ?? "").trim();
    payload.sport_id = trimmed ? trimmed : null;
  }

  if (input.name !== undefined) {
    const trimmed = String(input.name ?? "").trim();
    if (!trimmed) throw new Error("Template name is required.");
    payload.name = trimmed;
  }

  if (input.description !== undefined) {
    const trimmed = String(input.description ?? "").trim();
    payload.description = trimmed ? trimmed : null;
  }

  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }

  if (input.add_categories !== undefined) {
    if (!Array.isArray(input.add_categories)) {
      throw new Error("add_categories must be an array.");
    }
    payload.add_categories = input.add_categories.map((cat, idx) => {
      if (!cat?.name?.trim()) {
        throw new Error(`Category[${idx}]: name is required.`);
      }
      const catPayload: Record<string, unknown> = {
        name: cat.name.trim(),
        description: cat.description?.trim() || null,
        position: Number.isFinite(Number(cat.position))
          ? Number(cat.position)
          : idx + 1,
      };
      if (cat.subskills !== undefined) {
        if (!Array.isArray(cat.subskills)) {
          throw new Error(`Category[${idx}]: subskills must be an array.`);
        }
        catPayload.subskills = cat.subskills.map((sub, sIdx) => {
          if (!sub?.name?.trim()) {
            throw new Error(
              `Category[${idx}] Subskill[${sIdx}]: name is required.`,
            );
          }
          if (!sub?.skill_id?.trim()) {
            throw new Error(
              `Category[${idx}] Subskill[${sIdx}]: skill_id is required.`,
            );
          }
          const subPayload: Record<string, unknown> = {
            name: sub.name.trim(),
            description: sub.description?.trim() || null,
            position: Number.isFinite(Number(sub.position))
              ? Number(sub.position)
              : sIdx + 1,
            skill_id: sub.skill_id.trim(),
          };
          if (Number.isFinite(Number(sub.rating_min))) {
            subPayload.rating_min = Number(sub.rating_min);
          }
          if (Number.isFinite(Number(sub.rating_max))) {
            subPayload.rating_max = Number(sub.rating_max);
          }
          if (Number.isFinite(Number(sub.priority))) {
            subPayload.priority = Number(sub.priority);
          }
          return subPayload;
        });
      }
      return catPayload;
    });
  }

  if (input.remove_category_ids !== undefined) {
    if (!Array.isArray(input.remove_category_ids)) {
      throw new Error("remove_category_ids must be an array.");
    }
    payload.remove_category_ids = input.remove_category_ids
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id);
  }

  if (input.add_subskills !== undefined) {
    if (!Array.isArray(input.add_subskills)) {
      throw new Error("add_subskills must be an array.");
    }
    payload.add_subskills = input.add_subskills.map((sub, idx) => {
      if (!sub?.category_id?.trim()) {
        throw new Error(`Subskill[${idx}]: category_id is required.`);
      }
      if (!sub?.name?.trim()) {
        throw new Error(`Subskill[${idx}]: name is required.`);
      }
      if (!sub?.skill_id?.trim()) {
        throw new Error(`Subskill[${idx}]: skill_id is required.`);
      }
      const subPayload: Record<string, unknown> = {
        category_id: sub.category_id.trim(),
        name: sub.name.trim(),
        description: sub.description?.trim() || null,
        position: Number.isFinite(Number(sub.position))
          ? Number(sub.position)
          : idx + 1,
        skill_id: sub.skill_id.trim(),
      };
      if (Number.isFinite(Number(sub.rating_min))) {
        subPayload.rating_min = Number(sub.rating_min);
      }
      if (Number.isFinite(Number(sub.rating_max))) {
        subPayload.rating_max = Number(sub.rating_max);
      }
      if (Number.isFinite(Number(sub.priority))) {
        subPayload.priority = Number(sub.priority);
      }
      return subPayload;
    });
  }

  if (input.remove_subskill_ids !== undefined) {
    if (!Array.isArray(input.remove_subskill_ids)) {
      throw new Error("remove_subskill_ids must be an array.");
    }
    payload.remove_subskill_ids = input.remove_subskill_ids
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id);
  }

  return payload;
}

async function fetchScorecardTemplates(
  params: ListScorecardTemplatesParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: ScorecardTemplateRow[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildScorecardListQuery(params);
  const url =
    qs.length > 0
      ? `${baseUrl}/functions/v1/api/scorecard/list?${qs}`
      : `${baseUrl}/functions/v1/api/scorecard/list`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | ScorecardListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load scorecards.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeTemplate(item)).filter((t) => t.id);
  const countRaw = (data as any)?.count;
  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.isFinite(Number(countRaw))
        ? Number(countRaw)
        : undefined;

  return { items, count };
}

export async function listScorecardTemplates(
  params: ListScorecardTemplatesParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<ScorecardTemplateRow[]> {
  const result = await fetchScorecardTemplates(params, baseUrl);
  return result.items;
}

export async function listScorecardTemplatesPage(
  params: ListScorecardTemplatesParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: ScorecardTemplateRow[]; count?: number }> {
  return fetchScorecardTemplates(params, baseUrl);
}

export async function listScorecardCategoriesByTemplate(
  params: ListScorecardCategoriesParams,
  baseUrl = DEFAULT_BASE_URL,
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
    | ScorecardListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load scorecard categories.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  return rawItems
    .map((item) => normalizeCategory(item, params.scorecardTemplateId))
    .filter((c) => c.id);
}

export async function listScorecardSubskillsByCategory(
  params: ListScorecardSubskillsParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<ScorecardSubskillRow[]> {
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
    | ScorecardListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load scorecard subskills.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  return rawItems
    .map((item) => normalizeSubskill(item, params.categoryId))
    .filter((s) => s.id);
}

export async function getScorecardTemplateDetail(
  templateId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<ScorecardTemplateDetail> {
  if (!templateId?.trim()) {
    throw new Error("templateId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/scorecard/${templateId.trim()}/`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | ScorecardDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load scorecard template.");
  }

  return normalizeDetailPayload(data);
}

export async function updateScorecardTemplate(
  templateId: string,
  input: UpdateScorecardTemplateInput,
  options: { baseUrl?: string } = {},
): Promise<UpdateScorecardTemplateResponse> {
  if (!templateId?.trim()) {
    throw new Error("templateId is required.");
  }

  const payload = normalizeUpdatePayload(input);
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/functions/v1/api/scorecard/${templateId.trim()}/`;

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
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update scorecard template.");
  }

  if (!data) {
    throw new Error("Invalid response from update scorecard endpoint.");
  }

  return data;
}
