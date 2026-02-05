import type { DrillMedia } from "../services/drillsService"

export function pickPrimaryMedia(
  media: DrillMedia[] | null | undefined,
): DrillMedia | null {
  if (!Array.isArray(media) || media.length === 0) return null

  const sorted = [...media].sort((a, b) => {
    const aPos = Number.isFinite(a.position)
      ? Number(a.position)
      : Number.POSITIVE_INFINITY
    const bPos = Number.isFinite(b.position)
      ? Number(b.position)
      : Number.POSITIVE_INFINITY
    return aPos - bPos
  })

  return sorted.find((item) => item.type === "video" && item.url) ?? sorted[0]
}
