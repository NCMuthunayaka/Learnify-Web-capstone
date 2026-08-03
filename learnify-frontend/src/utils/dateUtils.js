/**
 * Safely parses a date string, handling naive UTC ISO strings (e.g., "2026-08-03T03:43:00")
 * by treating them as UTC so local timezone offsets don't skew relative time calculations.
 */
export function parseUTCDate(dateInput) {
  if (!dateInput) return null
  if (dateInput instanceof Date) return dateInput

  let str = String(dateInput).trim().replace(" ", "T")
  // Append 'Z' if no timezone offset (+/-HH:mm or Z) is present
  if (!str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += "Z"
  }
  const parsed = new Date(str)
  return isNaN(parsed.getTime()) ? new Date(dateInput) : parsed
}

/**
 * Calculates human-readable relative time (e.g. "Just now", "5m ago", "2h ago", "3d ago").
 */
export function timeAgo(isoString) {
  if (!isoString) return "Recently"
  const date = parseUTCDate(isoString)
  if (!date || isNaN(date.getTime())) return "Recently"

  const diff = Date.now() - date.getTime()
  if (diff < 0) return "Just now"

  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}
