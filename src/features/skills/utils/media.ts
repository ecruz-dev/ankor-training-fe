import type { SkillMedia } from "../services/skillsService";

const toPosition = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

const sortByPosition = (a: SkillMedia, b: SkillMedia) =>
  toPosition(a.position) - toPosition(b.position);

const normalizeType = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase() : "";

export function pickPrimarySkillMedia(
  media: SkillMedia[] | null | undefined,
): SkillMedia | null {
  if (!Array.isArray(media) || media.length === 0) return null;
  const sorted = [...media].sort(sortByPosition);
  return sorted[0] ?? null;
}

export function pickPrimarySkillVideo(
  media: SkillMedia[] | null | undefined,
): SkillMedia | null {
  if (!Array.isArray(media)) return null;
  const videos = media.filter((item) => normalizeType(item?.type) === "video");
  if (videos.length === 0) return null;
  return pickPrimarySkillMedia(videos);
}

export function pickSkillThumbnailUrl(
  media: SkillMedia[] | null | undefined,
): string | null {
  const video = pickPrimarySkillVideo(media);
  if (video?.thumbnail_url) return video.thumbnail_url;

  const images = Array.isArray(media)
    ? media.filter((item) => normalizeType(item?.type) === "image")
    : [];
  const image = pickPrimarySkillMedia(images);
  if (image?.url) return image.url;

  const primary = pickPrimarySkillMedia(media);
  return primary?.thumbnail_url ?? null;
}
