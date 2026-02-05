import type { DrillItem } from "../services/drillsService";
import type { DrillCard, DrillFilters } from "../types";
import { pickPrimaryMedia } from "./media";
import { toYouTubeThumbnail } from "./youtube";

export const createEmptyFilters = (): DrillFilters => ({
  tags: new Set(),
  segmentId: "",
  levels: new Set(),
  minAge: "",
  maxAge: "",
  minPlayers: "",
  maxPlayers: "",
});

export const toOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeSkillTags = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of raw) {
    let label = "";

    if (typeof tag === "string") {
      label = tag.trim();
    } else if (tag && typeof tag === "object") {
      const rawLabel =
        (tag as any).name ??
        (tag as any).label ??
        (tag as any).tag ??
        (tag as any).title;
      const rawId = (tag as any).id ?? (tag as any).skill_id ?? (tag as any).tag_id;

      if (typeof rawLabel === "string") label = rawLabel.trim();
      else if (typeof rawId === "string") label = rawId.trim();
    }

    if (!label || seen.has(label)) continue;
    seen.add(label);
    normalized.push(label);
  }

  return normalized;
};

const normalizeLevel = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
};

const pickDrillName = (item: DrillItem): string => {
  const rawName =
    (item as any).name ??
    (item as any).title ??
    (item as any).drill_name ??
    (item as any).drill?.name;

  if (typeof rawName === "string" && rawName.trim()) return rawName.trim();
  return "Untitled drill";
};

export function toDrillCard(item: DrillItem): DrillCard {
  const primaryMedia = pickPrimaryMedia(item.media ?? []);
  const videoUrl = primaryMedia?.url ?? "";
  const thumbnailUrl =
    primaryMedia?.thumbnail_url ??
    (videoUrl ? toYouTubeThumbnail(videoUrl) : null);
  const rawTags =
    (item as any).skill_tags ??
    (item as any).tags ??
    (item as any).tag_ids ??
    (item as any).skill_tag_ids;

  return {
    id: item.id,
    name: pickDrillName(item),
    segment: item.segment?.name ?? undefined,
    tags: normalizeSkillTags(rawTags),
    level: normalizeLevel((item as any).level ?? (item as any).difficulty),
    min_players: toNullableNumber((item as any).min_players),
    max_players: toNullableNumber((item as any).max_players),
    duration_min: toNullableNumber((item as any).duration_min),
    created_at: item.created_at,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
  };
}

export function playerLabel(drill: DrillCard) {
  const hasMin = drill.min_players !== null && drill.min_players !== undefined;
  const hasMax = drill.max_players !== null && drill.max_players !== undefined;
  if (hasMin && hasMax) return `${drill.min_players}-${drill.max_players} players`;
  if (hasMin) return `Min ${drill.min_players} players`;
  if (hasMax) return `Max ${drill.max_players} players`;
  return "Any size";
}
