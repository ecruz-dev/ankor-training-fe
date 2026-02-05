export function formatEvaluationReportDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date)

  const map = parts.reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  const month = map.month?.toUpperCase()
  const day = map.day
  const year = map.year
  const hour = map.hour
  const minute = map.minute
  const dayPeriod = map.dayPeriod?.toUpperCase()

  if (!month || !day || !year || !hour || !minute || !dayPeriod) {
    return date.toLocaleString('en-US')
  }

  return `${month} ${day}, ${year} AT ${hour}:${minute} ${dayPeriod}`
}
