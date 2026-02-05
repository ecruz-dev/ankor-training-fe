// src/services/skillsService.ts
// Pure fetch wrapper to call your Deno edge function: /functions/v1/skills-list
// Mirrors the style of signupService.ts (typed, no Supabase client here).

import { apiFetch } from '../../../shared/api/apiClient'

export type SkillMediaType = "image" | "video" | "document" | "link" | string;

export type SkillMedia = {
  id: string;
  skill_id: string;
  type: SkillMediaType;
  url: string;
  storage_path: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  position: number | null;
};

export type Skill = {
  id: string;
  org_id: string;
  sport_id: string | null;
  category: string;
  title: string;
  description: string | null;
  level: string;
  visibility: string;
  status: string;
  created_at: string;
  updated_at: string;
  coaching_points?: string[] | null;
  created_by?: string | null;
  media?: SkillMedia[] | null;
};

export type SkillsListResponse =
  | { ok: true; count?: number; items?: Skill[]; data?: Skill[] }
  | { ok: false; error: string };

export type CreateSkillInput = {
  org_id: string;
  sport_id?: string | null;
  category: string;
  title: string;
  description?: string | null;
  level?: string | null;
  visibility?: string | null;
  status?: string | null;
};

export type CreateSkillResponse =
  | { ok: true; skill?: Skill; data?: Skill }
  | { ok: false; error: string };

export type SkillDetailResponse =
  | { ok: true; skill?: Skill; data?: Skill }
  | { ok: false; error: string };

export type UpdateSkillInput = {
  title?: string;
  description?: string | null;
  level?: string | null;
  visibility?: string | null;
  status?: string | null;
  category?: string | null;
  sport_id?: string | null;
};

export type UpdateSkillResponse =
  | { ok: true; skill?: Skill; data?: Skill }
  | { ok: false; error: string };

export type SkillMediaUploadUrlInput = {
  org_id?: string;
  skill_id?: string | null;
  file_name?: string | null;
  content_type?: string | null;
  content_length?: number | null;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  position?: number | null;
} & Record<string, unknown>;

export type SkillMediaUploadUrlResponse =
  | {
      ok: true;
      upload: {
        bucket: string;
        path: string;
        signed_url: string;
        token: string;
        public_url: string;
      };
      media: SkillMedia;
    }
  | { ok: false; error: string };

export type CreateSkillMediaInput = {
  skill_id: string;
  org_id?: string | null;
  storage_path?: string | null;
  url: string;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  media_type?: SkillMediaType | null;
  position?: number | null;
} & Record<string, unknown>;

export type CreateSkillMediaResponse =
  | { ok: true; media?: SkillMedia; data?: SkillMedia }
  | { ok: false; error: string };

export type SkillMediaPlayResponse =
  | {
      ok: true;
      media: SkillMedia;
      play_url: string;
      expires_in: number;
    }
  | { ok: false; error: string };

export type ListSkillsParams = {
  orgId: string;               // required
  sportId?: string | null;     // optional
  q?: string;                  // optional search
  category?: string;
  level?: string;
  visibility?: string;
  status?: string;
  limit?: number;              // default 50 (handled server-side unless provided)
  offset?: number;             // default 0 (handled server-side unless provided)
};

function buildQuery(params: ListSkillsParams) {
  const u = new URLSearchParams();
  u.set("org_id", params.orgId);
  if (params.sportId) u.set("sport_id", params.sportId);
  if (params.q?.trim()) u.set("q", params.q.trim());
  if (params.category?.trim()) u.set("category", params.category.trim());
  if (params.level?.trim()) u.set("level", params.level.trim());
  if (params.visibility?.trim()) u.set("visibility", params.visibility.trim());
  if (params.status?.trim()) u.set("status", params.status.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function normalizeSkillMedia(raw: unknown): SkillMedia[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const rawType = item?.type ?? item?.media_type ?? item?.mediaType;
      const type =
        typeof rawType === "string" ? rawType.toLowerCase() : "video";

      return {
        id: typeof item?.id === "string" ? item.id : "",
        skill_id: typeof item?.skill_id === "string" ? item.skill_id : "",
        type,
        url: typeof item?.url === "string" ? item.url : "",
      storage_path:
        typeof item?.storage_path === "string" ? item.storage_path : null,
      title: typeof item?.title === "string" ? item.title : null,
      description: typeof item?.description === "string" ? item.description : null,
      thumbnail_url:
        typeof item?.thumbnail_url === "string" ? item.thumbnail_url : null,
      position: Number.isFinite(Number(item?.position))
        ? Number(item.position)
        : null,
      };
    })
    .filter((item) => item.url);
}

function normalizeSkill(raw: any): Skill {
  const coachingPoints = Array.isArray(raw?.coaching_points)
    ? raw.coaching_points.filter((point: unknown) => typeof point === "string")
    : Array.isArray(raw?.coachingPoints)
      ? raw.coachingPoints.filter((point: unknown) => typeof point === "string")
      : null;

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : "",
    sport_id: typeof raw?.sport_id === "string" ? raw.sport_id : null,
    category: typeof raw?.category === "string" ? raw.category : "",
    title:
      typeof raw?.title === "string"
        ? raw.title
        : typeof raw?.name === "string"
          ? raw.name
          : "",
    description: typeof raw?.description === "string" ? raw.description : null,
    level: typeof raw?.level === "string" ? raw.level : "",
    visibility: typeof raw?.visibility === "string" ? raw.visibility : "",
    status: typeof raw?.status === "string" ? raw.status : "",
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
          : "",
    coaching_points: coachingPoints,
    created_by: typeof raw?.created_by === "string" ? raw.created_by : null,
    media: normalizeSkillMedia(raw?.media),
  };
}

function normalizeCreatePayload(input: CreateSkillInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.category?.trim()) throw new Error("category is required.");
  if (!input.title?.trim()) throw new Error("title is required.");

  const description = input.description?.trim();
  const level = input.level?.trim();
  const visibility = input.visibility?.trim();
  const status = input.status?.trim();
  const sportId = input.sport_id?.trim();

  return {
    org_id: input.org_id.trim(),
    sport_id: sportId ? sportId : null,
    category: input.category.trim(),
    title: input.title.trim(),
    description: description ? description : null,
    level: level ? level : null,
    visibility: visibility ? visibility : null,
    status: status ? status : null,
  };
}

function normalizeUpdatePayload(input: UpdateSkillInput) {
  const payload: Record<string, unknown> = {};

  const normalizeString = (value: unknown, field: string) => {
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

  const title = normalizeString(input.title, "title");
  if (title !== undefined) payload.title = title;

  const category = normalizeString(input.category, "category");
  if (category !== undefined) payload.category = category;

  const description = normalizeOptionalString(input.description);
  if (description !== undefined) payload.description = description;

  const level = normalizeOptionalString(input.level);
  if (level !== undefined) payload.level = level;

  const visibility = normalizeOptionalString(input.visibility);
  if (visibility !== undefined) payload.visibility = visibility;

  const status = normalizeOptionalString(input.status);
  if (status !== undefined) payload.status = status;

  const sportId = normalizeOptionalString(input.sport_id);
  if (sportId !== undefined) payload.sport_id = sportId;

  return payload;
}

async function fetchSkills(
  params: ListSkillsParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: Skill[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildQuery(params);
  const url = `${baseUrl}/functions/v1/api/skills/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | SkillsListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load skills.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeSkill(item)).filter((s) => s.id);
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
 * Fetch skills for an org (optionally by sport) from your local backend.
 * Defaults to http://localhost:8000; override with VITE_BACKEND_URL if desired.
 *
 * Returns a plain array of Skill items (so you can .then(setSkills)).
 */
export async function listSkills(
  params: ListSkillsParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<Skill[]> {
  const result = await fetchSkills(params, baseUrl);
  return result.items;
}

export async function listSkillsPage(
  params: ListSkillsParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: Skill[]; count?: number }> {
  return fetchSkills(params, baseUrl);
}

/**
 * POST /functions/v1/api/skills
 */
export async function createSkill(
  input: CreateSkillInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<CreateSkillResponse> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/skills`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateSkillResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to create skill.");
  }

  return data;
}

/**
 * GET /functions/v1/api/skills/:id
 */
export async function getSkillById(
  skillId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<Skill> {
  if (!skillId?.trim()) {
    throw new Error("skillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/skills/${skillId}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | SkillDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load skill.");
  }

  const raw = (data as any)?.skill ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from skill detail endpoint.");
  }

  return normalizeSkill(raw);
}

/**
 * PATCH /functions/v1/api/skills/:id
 */
export async function updateSkill(
  skillId: string,
  input: UpdateSkillInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<Skill> {
  if (!skillId?.trim()) {
    throw new Error("skillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/skills/${skillId}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateSkillResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update skill.");
  }

  const raw = (data as any)?.skill ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from skill update endpoint.");
  }

  return normalizeSkill(raw);
}

/**
 * POST /functions/v1/api/skills/media/upload-url
 */
export async function createSkillMediaUploadUrl(
  payload: SkillMediaUploadUrlInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<SkillMediaUploadUrlResponse> {
  const url = `${baseUrl}/functions/v1/api/skills/media/upload-url`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    orgId: payload?.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | SkillMediaUploadUrlResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error(
      (data as any)?.error || "Failed to get skill media upload URL.",
    );
  }
  if (!data) {
    throw new Error("Invalid response from skill media upload URL endpoint.");
  }

  return data;
}

/**
 * POST /functions/v1/api/skills/media
 */
export async function createSkillMedia(
  payload: CreateSkillMediaInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<CreateSkillMediaResponse> {
  if (!payload?.skill_id?.trim()) {
    throw new Error("skill_id is required.");
  }

  const url = `${baseUrl}/functions/v1/api/skills/media`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload?.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateSkillMediaResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to create skill media.");
  }
  if (!data) {
    throw new Error("Invalid response from skill media endpoint.");
  }

  return data;
}

/**
 * GET /functions/v1/api/skills/media/:skillId/play
 */
export async function getSkillMediaPlay(
  skillId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<SkillMediaPlayResponse> {
  if (!skillId?.trim()) {
    throw new Error("skillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/skills/media/${skillId}/play`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | SkillMediaPlayResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error(
      (data as any)?.error || "Failed to load skill media play URL.",
    );
  }
  if (!data) {
    throw new Error("Invalid response from skill media play endpoint.");
  }

  return data;
}

// Small helper if you want a consistent label
export function skillLabel(s: Skill) {
  return `${s.category} ’'?" ${s.title}`;
}
