// src/services/drillsService.ts
// Pure fetch wrappers to call your Deno edge functions under /functions/v1/api/drills/*

import { apiFetch } from '../../../shared/api/apiClient'

export type DrillMediaType = "image" | "video" | "document" | "link";

export type DrillMediaInput = {
  type?: DrillMediaType;
  url: string;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  position?: number | null;
};

export type CreateDrillInput = {
  org_id: string;
  segment_id: string;
  sport_id?: string | null;
  name: string;
  description?: string | null;
  instructions?: string | null;
  level?: string | null;
  min_players?: number | null;
  max_players?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  duration_seconds?: number | null;
  created_by?: string | null;
  media?: DrillMediaInput[];
  skill_tags?: Array<string | { skill_id: string }>;
};

export type CreateDrillResponse =
  | { ok: true; drill?: any }
  | { ok: false; error: string };

export type UpdateDrillInput = {
  name?: string;
  description?: string | null;
  instructions?: string | null;
  level?: string | null;
  segment_id?: string | null;
  min_age?: number | string | null;
  max_age?: number | string | null;
  min_players?: number | string | null;
  max_players?: number | string | null;
  duration_seconds?: number | string | null;
  duration_min?: number | string | null;
  visibility?: string | null;
  is_archived?: boolean;
  add_tag_ids?: string[];
  remove_tag_ids?: string[];
};

export type DrillSegment = {
  id: string;
  name: string | null;
};

export type DrillTag = {
  id: string;
  name: string;
};

export type DrillMedia = {
  type: DrillMediaType;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  position: number | null;
};

export type DrillMediaItem = {
  id: string;
  drill_id: string;
  type: DrillMediaType;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  position: number | null;
};

export type DrillMediaUploadUrlInput = {
  org_id?: string;
  drill_id?: string | null;
  media_type?: DrillMediaType | null;
  file_name?: string | null;
  content_type?: string | null;
  content_length?: number | null;
} & Record<string, unknown>;

export type DrillMediaUploadUrlResponse =
  | {
      ok: true;
      upload: {
        bucket: string;
        path: string;
        signed_url: string;
        token: string;
        public_url: string;
      };
      media: DrillMedia;
    }
  | { ok: false; error: string };

export type CreateDrillMediaInput = DrillMediaInput & {
  drill_id: string;
  org_id?: string | null;
} & Record<string, unknown>;

export type CreateDrillMediaResponse =
  | { ok: true; media?: DrillMedia; data?: DrillMedia }
  | { ok: false; error: string };

export type DrillMediaPlayResponse =
  | {
      ok: true;
      media: DrillMediaItem;
      play_url: string;
      expires_in: number;
    }
  | { ok: false; error: string };

export type DrillItem = {
  id: string;
  org_id: string | null;
  segment_id: string | null;
  name: string;
  description: string | null;
  level: string | null;
  min_players: number | null;
  max_players: number | null;
  min_age: number | null;
  max_age: number | null;
  duration_min: number | null;
  visibility: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  segment: DrillSegment | null;
  skill_tags: DrillTag[];
  media: DrillMedia[];
};

export type DrillsListResponse =
  | { ok: true; count?: number; items?: DrillItem[]; data?: DrillItem[] }
  | { ok: false; error: string };

export type DrillDetailResponse =
  | { ok: true; drill?: DrillItem; data?: DrillItem }
  | { ok: false; error: string };

export type UpdateDrillResponse =
  | { ok: true; drill?: DrillItem; data?: DrillItem }
  | { ok: false; error: string };

export type DrillSegmentsResponse =
  | { ok: true; count?: number; items?: DrillSegment[]; data?: DrillSegment[]; segments?: DrillSegment[] }
  | { ok: false; error: string };

export type DrillTagsResponse =
  | { ok: true; count?: number; items?: DrillTag[]; data?: DrillTag[]; tags?: DrillTag[] }
  | { ok: false; error: string };

export type ListDrillsParams = {
  orgId: string;
  name?: string;
  segmentIds?: string[];
  levels?: string[];
  minAge?: number | null;
  maxAge?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  skillTagIds?: string[];
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCreatePayload(input: CreateDrillInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.segment_id?.trim()) throw new Error("segment_id is required.");
  if (!input.name?.trim()) throw new Error("name is required.");

  const media = (input.media ?? []).map((item, index) => ({
    type: item.type ?? "video",
    url: item.url,
    title: item.title ?? null,
    description: item.description ?? null,
    thumbnail_url: item.thumbnail_url ?? null,
    position: Number.isFinite(item.position as number)
      ? Number(item.position)
      : index + 1,
  }));

  const skill_tags = (input.skill_tags ?? [])
    .map((tag) => (typeof tag === "string" ? tag : tag.skill_id))
    .filter((tag) => typeof tag === "string" && tag.trim().length > 0);

  return {
    org_id: input.org_id.trim(),
    segment_id: input.segment_id.trim(),
    sport_id: input.sport_id ?? null,
    name: input.name.trim(),
    description: input.description ?? null,
    instructions: input.instructions ?? null,
    level: input.level ?? null,
    min_players: input.min_players ?? null,
    max_players: input.max_players ?? null,
    min_age: input.min_age ?? null,
    max_age: input.max_age ?? null,
    duration_seconds: input.duration_seconds ?? null,
    created_by: input.created_by ?? null,
    media,
    skill_tags,
  };
}

function normalizeUpdatePayload(input: UpdateDrillInput) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (input.name === null) {
      throw new Error("name cannot be null.");
    }
    const trimmed = String(input.name).trim();
    if (!trimmed) {
      throw new Error("name is required.");
    }
    payload.name = trimmed;
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      payload.description = null;
    } else {
      const trimmed = String(input.description).trim();
      payload.description = trimmed ? trimmed : null;
    }
  }

  if (input.instructions !== undefined) {
    if (input.instructions === null) {
      payload.instructions = null;
    } else {
      const trimmed = String(input.instructions).trim();
      payload.instructions = trimmed ? trimmed : null;
    }
  }

  if (input.level !== undefined) {
    if (input.level === null) {
      payload.level = null;
    } else {
      const trimmed = String(input.level).trim();
      payload.level = trimmed ? trimmed : null;
    }
  }

  if (input.segment_id !== undefined) {
    if (input.segment_id === null) {
      payload.segment_id = null;
    } else {
      const trimmed = String(input.segment_id).trim();
      payload.segment_id = trimmed ? trimmed : null;
    }
  }

  const normalizeNumber = (
    value: number | string | null | undefined,
    field: string,
  ) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error(`${field} must be a number.`);
      }
      return value;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        throw new Error(`${field} must be a number.`);
      }
      return parsed;
    }
    throw new Error(`${field} must be a number.`);
  };

  const minAge = normalizeNumber(input.min_age, "min_age");
  if (minAge !== undefined) payload.min_age = minAge;

  const maxAge = normalizeNumber(input.max_age, "max_age");
  if (maxAge !== undefined) payload.max_age = maxAge;

  const minPlayers = normalizeNumber(input.min_players, "min_players");
  if (minPlayers !== undefined) payload.min_players = minPlayers;

  const maxPlayers = normalizeNumber(input.max_players, "max_players");
  if (maxPlayers !== undefined) payload.max_players = maxPlayers;

  const durationSeconds = normalizeNumber(
    input.duration_seconds,
    "duration_seconds",
  );
  if (durationSeconds !== undefined) payload.duration_seconds = durationSeconds;

  const durationMin = normalizeNumber(input.duration_min, "duration_min");
  if (durationMin !== undefined) payload.duration_min = durationMin;

  if (input.visibility !== undefined) {
    if (input.visibility === null) {
      payload.visibility = null;
    } else {
      const trimmed = String(input.visibility).trim();
      payload.visibility = trimmed ? trimmed : null;
    }
  }

  if (input.is_archived !== undefined) {
    if (typeof input.is_archived !== "boolean") {
      throw new Error("is_archived must be a boolean.");
    }
    payload.is_archived = input.is_archived;
  }

  const normalizeTagIds = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    const normalized = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
    return Array.from(new Set(normalized));
  };

  if (input.add_tag_ids !== undefined || input.remove_tag_ids !== undefined) {
    payload.add_tag_ids = normalizeTagIds(input.add_tag_ids);
    payload.remove_tag_ids = normalizeTagIds(input.remove_tag_ids);
  }

  return payload;
}

function buildListQuery(params: ListDrillsParams) {
  const u = new URLSearchParams();

  u.set("org_id", params.orgId);
  if (params.name?.trim()) u.set("name", params.name.trim());
  if (params.segmentIds?.length) u.set("segment_ids", params.segmentIds.join(","));
  if (params.levels?.length) {
    const normalized = params.levels.map((level) => level.trim()).filter(Boolean);
    if (normalized.length) u.set("levels", normalized.join(","));
  }
  if (Number.isFinite(params.minAge)) u.set("min_age", String(params.minAge));
  if (Number.isFinite(params.maxAge)) u.set("max_age", String(params.maxAge));
  if (Number.isFinite(params.minPlayers)) u.set("min_players", String(params.minPlayers));
  if (Number.isFinite(params.maxPlayers)) u.set("max_players", String(params.maxPlayers));
  if (params.skillTagIds?.length) u.set("skill_tags", params.skillTagIds.join(","));
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));

  return u.toString();
}

function normalizeDrillTags(raw: unknown): DrillTag[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const normalized: DrillTag[] = [];

  for (const item of raw) {
    let id: string | null = null;
    let name: string | null = null;

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (RE_UUID.test(trimmed)) {
        id = trimmed;
        name = trimmed;
      }
    } else if (item && typeof item === "object") {
      const typed = item as any;
      const nested =
        typed.drill_tags ??
        typed.drill_tag ??
        (typeof typed.tag === "object" ? typed.tag : undefined);

      const rawId =
        typed.id ??
        typed.skill_id ??
        typed.tag_id ??
        (nested && typeof nested === "object" ? nested.id ?? nested.tag_id : undefined);
      if (typeof rawId === "string") id = rawId.trim();

      const rawName =
        typed.name ??
        (typeof typed.tag === "string" ? typed.tag : undefined) ??
        typed.title ??
        typed.label ??
        (nested && typeof nested === "object"
          ? nested.name ?? nested.label ?? nested.title
          : undefined);
      if (typeof rawName === "string") name = rawName.trim();
    }

    if (id && !name) name = id;
    if (!id || !name) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({ id, name });
  }

  return normalized;
}

function normalizeMediaType(rawType: unknown, url: string): DrillMediaType {
  const normalized = typeof rawType === "string" ? rawType.toLowerCase() : "";
  if (
    normalized === "image" ||
    normalized === "video" ||
    normalized === "document" ||
    normalized === "link"
  ) {
    return normalized as DrillMediaType;
  }

  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.includes("youtu.be") ||
    lowerUrl.includes("youtube.com") ||
    /\.(mp4|webm|mov|m4v|mkv)(\?|#|$)/.test(lowerUrl)
  ) {
    return "video";
  }
  if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/.test(lowerUrl)) {
    return "image";
  }
  if (/\.(pdf|docx?|pptx?)(\?|#|$)/.test(lowerUrl)) {
    return "document";
  }

  return "link";
}

function normalizeDrillMedia(raw: unknown): DrillMedia[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as any;
      const url = typeof typed.url === "string" ? typed.url : "";
      if (!url) return null;

      const positionRaw = typed.position ?? typed.sort_order ?? typed.order;

      return {
        type: normalizeMediaType(typed.type ?? typed.media_type, url),
        url,
        title: typeof typed.title === "string" ? typed.title : null,
        description: typeof typed.description === "string" ? typed.description : null,
        thumbnail_url:
          typeof typed.thumbnail_url === "string" ? typed.thumbnail_url : null,
        position: Number.isFinite(positionRaw) ? Number(positionRaw) : index + 1,
      } as DrillMedia;
    })
    .filter((item): item is DrillMedia => Boolean(item));
}

function normalizeDrillDetail(raw: any): DrillItem {
  const segmentRaw = raw?.segment;
  const segment =
    segmentRaw && typeof segmentRaw === "object"
      ? {
          id:
            typeof segmentRaw.id === "string"
              ? segmentRaw.id
              : typeof raw.segment_id === "string"
                ? raw.segment_id
                : "",
          name: typeof segmentRaw.name === "string" ? segmentRaw.name : null,
        }
      : null;

  const skillTagsRaw =
    ([] as unknown[]).concat(
      Array.isArray(raw?.skill_tags) ? raw.skill_tags : [],
      Array.isArray(raw?.skill_tag_ids) ? raw.skill_tag_ids : [],
      Array.isArray(raw?.tags) ? raw.tags : [],
      Array.isArray(raw?.tag_ids) ? raw.tag_ids : [],
      Array.isArray(raw?.skillTagIds) ? raw.skillTagIds : [],
      Array.isArray(raw?.drill_tag_map) ? raw.drill_tag_map : [],
    );

  const skillTags = normalizeDrillTags(skillTagsRaw);
  const mediaRaw = raw?.media ?? raw?.drill_media ?? raw?.drillMedia ?? [];

  return {
    id: raw?.id,
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    segment_id:
      typeof raw?.segment_id === "string"
        ? raw.segment_id
        : segment?.id ?? null,
    name: typeof raw?.name === "string" ? raw.name : raw?.title ?? "",
    description: typeof raw?.description === "string" ? raw.description : null,
    level:
      typeof raw?.level === "string"
        ? raw.level
        : typeof raw?.difficulty === "string"
          ? raw.difficulty
          : null,
    min_players: Number.isFinite(raw?.min_players)
      ? Number(raw.min_players)
      : null,
    max_players: Number.isFinite(raw?.max_players)
      ? Number(raw.max_players)
      : null,
    min_age: Number.isFinite(raw?.min_age) ? Number(raw.min_age) : null,
    max_age: Number.isFinite(raw?.max_age) ? Number(raw.max_age) : null,
    duration_min: Number.isFinite(raw?.duration_min)
      ? Number(raw.duration_min)
      : null,
    visibility: typeof raw?.visibility === "string" ? raw.visibility : null,
    is_archived: Boolean(raw?.is_archived),
    created_at: raw?.created_at ?? "",
    updated_at: raw?.updated_at ?? raw?.created_at ?? "",
    segment,
    skill_tags: skillTags,
    media: normalizeDrillMedia(mediaRaw),
  };
}

/**
 * POST /functions/v1/api/drills
 */
export async function createDrill(
  input: CreateDrillInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<CreateDrillResponse> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/drills`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateDrillResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to create drill.");
  }

  return data;
}

/**
 * PATCH /functions/v1/api/drills/:id
 */
export async function updateDrill(
  drillId: string,
  input: UpdateDrillInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<DrillItem> {
  if (!drillId?.trim()) {
    throw new Error("drillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/drills/${drillId}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateDrillResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update drill.");
  }

  const raw = (data as any)?.drill ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from drill update endpoint.");
  }

  return normalizeDrillDetail(raw);
}

/**
 * POST /functions/v1/api/drills/media/upload-url
 */
export async function createDrillMediaUploadUrl(
  payload: DrillMediaUploadUrlInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<DrillMediaUploadUrlResponse> {
  const url = `${baseUrl}/functions/v1/api/drills/media/upload-url`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    orgId: payload?.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillMediaUploadUrlResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to get drill media upload URL.");
  }
  if (!data) {
    throw new Error("Invalid response from drill media upload URL endpoint.");
  }

  return data;
}

/**
 * POST /functions/v1/api/drills/media
 */
export async function createDrillMedia(
  payload: CreateDrillMediaInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<CreateDrillMediaResponse> {
  if (!payload?.drill_id?.trim()) {
    throw new Error("drill_id is required.");
  }

  const url = `${baseUrl}/functions/v1/api/drills/media`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload?.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateDrillMediaResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to create drill media.");
  }
  if (!data) {
    throw new Error("Invalid response from drill media endpoint.");
  }

  return data;
}

/**
 * GET /functions/v1/api/drills/media/:drillId/play
 */
export async function getDrillMediaPlay(
  drillId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<DrillMediaPlayResponse> {
  if (!drillId?.trim()) {
    throw new Error("drillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/drills/media/${drillId}/play`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillMediaPlayResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load drill media play URL.");
  }
  if (!data) {
    throw new Error("Invalid response from drill media play endpoint.");
  }

  return data;
}

/**
 * GET /functions/v1/api/drills/list
 */
export async function listDrills(
  params: ListDrillsParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: DrillItem[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildListQuery(params);
  const url = `${baseUrl}/functions/v1/api/drills/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillsListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load drills.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeDrillDetail(item));
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
 * GET /functions/v1/api/drills/:id
 */
export async function getDrilById(
  drillId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<DrillItem> {
  if (!drillId?.trim()) {
    throw new Error("drillId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/drills/${drillId}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load drill.");
  }

  const raw = (data as any)?.drill ?? (data as any)?.data ?? data;

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from drill detail endpoint.");
  }

  return normalizeDrillDetail(raw);
}

/**
 * GET /functions/v1/api/drills/segments
 */
export async function listDrillSegments(
  params: { orgId?: string | null; baseUrl?: string } = {},
): Promise<DrillSegment[]> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = params;
  const url = `${baseUrl}/functions/v1/api/drills/segments`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillSegmentsResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load drill segments.");
  }

  return (data.items ?? (data as any).data ?? (data as any).segments ?? []) as DrillSegment[];
}

/**
 * GET /functions/v1/api/drills/tags
 */
export async function listDrillTags(
  params: { orgId?: string | null; baseUrl?: string } = {},
): Promise<DrillTag[]> {
  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = params;
  const url = `${baseUrl}/functions/v1/api/drills/tags`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | DrillTagsResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load drill tags.");
  }

  const raw = (data.items ?? (data as any).data ?? (data as any).tags ?? []) as unknown;
  return normalizeDrillTags(raw);
}

// Optional label helper for UI lists
export function drillLabel(d: DrillItem) {
  return d.name;
}
