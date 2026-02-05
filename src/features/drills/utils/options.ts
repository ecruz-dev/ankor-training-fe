import type { DrillTag } from "../services/drillsService"

export type SegmentOption = {
  id: string
  label: string
}

export function toSegmentOptions(
  segments: Array<{ id: string; name: string | null }>,
): SegmentOption[] {
  return segments
    .map((segment) => ({
      id: segment.id,
      label: segment.name?.trim() || "Unnamed Segment",
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function normalizeTagOptions(tags: DrillTag[]): DrillTag[] {
  return Array.from(
    new Map(
      tags
        .filter((tag) => tag.id && tag.name)
        .map((tag) => [
          tag.id,
          { id: tag.id.trim(), name: tag.name.trim() || tag.id.trim() },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))
}
