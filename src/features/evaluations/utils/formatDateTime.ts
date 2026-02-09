export function formatDateTime(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const parts = formatter.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((part) => part.type === type)?.value ?? ''

  const month = get('month')
  const day = get('day')
  const year = get('year')
  const hour = get('hour')
  const minute = get('minute')
  const dayPeriod = get('dayPeriod').toLowerCase()

  if (!month || !day || !year || !hour || !minute) {
    return formatter.format(d)
  }

  const period = dayPeriod || ''
  return `${month} ${day} ${year} at ${hour}:${minute}${period}`
}
