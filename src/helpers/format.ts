/**
 * Formatting helpers — pure, framework-agnostic.
 */

/** "Thu 14 May" or "Thu 14 May 2026" if not in current year. */
export function formatShiftDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  })
}

/** Convert a 24-hour 'HH:mm' string to 12-hour 'h:mm AM/PM'. */
export function formatTime12h(time24: string): string {
  const [hStr, m = '00'] = time24.split(':')
  const h24 = Number(hStr)
  if (Number.isNaN(h24)) return time24
  const period = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m} ${period}`
}

/** "7:00 AM – 3:00 PM" — 12-hour display for shift cards. */
export function formatShiftTimes(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`
}

/** "$68/hr" — no decimals if whole number. */
export function formatRate(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}/hr` : `$${amount.toFixed(2)}/hr`
}

/** "2 days ago", "in 5 days", "today". */
export function formatRelativeDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

/** "Posted 2h ago" from an ISO timestamp. */
export function formatTimeAgo(iso: string): string {
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.round(day / 30)
  if (month < 12) return `${month}mo ago`
  return `${Math.round(month / 12)}y ago`
}
