export function getRatingScale(
  minRating?: number | null,
  maxRating?: number | null,
): number[] {
  const min = typeof minRating === 'number' ? minRating : 1
  const max = typeof maxRating === 'number' ? maxRating : 5
  const safeMax = Math.max(min, max)
  return Array.from({ length: safeMax - min + 1 }, (_, index) => min + index)
}
