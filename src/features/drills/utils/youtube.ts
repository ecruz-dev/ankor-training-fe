export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "")
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v")
    }
    const parts = parsed.pathname.split("/").filter(Boolean)
    const embedIndex = parts.findIndex((part) => part === "embed")
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1]
    }
  } catch {
    return null
  }

  return null
}

export function toYouTubeThumbnailFromId(id?: string | null): string | null {
  if (!id) return null
  const trimmed = id.trim()
  if (!trimmed) return null
  return `https://img.youtube.com/vi/${trimmed}/hqdefault.jpg`
}

export function toYouTubeThumbnail(url?: string | null): string | null {
  const id = extractYouTubeId(url)
  return toYouTubeThumbnailFromId(id)
}

export function toYouTubeEmbedUrlFromId(id?: string | null): string | null {
  if (!id) return null
  const trimmed = id.trim()
  if (!trimmed) return null
  return `https://www.youtube.com/embed/${trimmed}?rel=0&modestbranding=1`
}

export function toYouTubeEmbedUrl(url?: string | null): string | null {
  const id = extractYouTubeId(url)
  return toYouTubeEmbedUrlFromId(id)
}
