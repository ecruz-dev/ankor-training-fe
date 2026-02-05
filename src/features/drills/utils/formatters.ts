export function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRange(
  min: number | null,
  max: number | null,
  unitLabel: string,
  emptyLabel: string,
): string {
  const hasMin = Number.isFinite(min)
  const hasMax = Number.isFinite(max)
  if (hasMin && hasMax) return `${min}-${max} ${unitLabel}`
  if (hasMin) return `Min ${min} ${unitLabel}`
  if (hasMax) return `Max ${max} ${unitLabel}`
  return emptyLabel
}
