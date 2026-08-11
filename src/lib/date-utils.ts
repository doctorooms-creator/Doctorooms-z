/**
 * Timezone-aware date utilities.
 * The server runs in UTC but the app serves users in IST (Asia/Calcutta).
 * All "today" boundaries must be computed in IST, not UTC.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // +5:30

/**
 * Get the current date/time in IST as a JS Date.
 */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS)
}

/**
 * Get YYYY-MM-DD string for today in IST.
 */
export function todayISTStr(): string {
  const ist = nowIST()
  const y = ist.getUTCFullYear()
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ist.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get start-of-day (00:00:00.000) and end-of-day (23:59:59.999) in IST,
 * returned as UTC Date objects suitable for Prisma queries.
 *
 * Example: If IST today is Aug 12, then:
 *   start = 2026-08-11T18:30:00.000Z  (Aug 12 00:00 IST)
 *   end   = 2026-08-12T18:29:59.999Z  (Aug 12 23:59:59 IST)
 */
export function todayISTRange(): { start: Date; end: Date } {
  const ist = nowIST()
  const y = ist.getUTCFullYear()
  const m = ist.getUTCMonth()
  const d = ist.getUTCDate()

  // IST midnight as UTC
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS)
  // IST 23:59:59.999 as UTC
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS)

  return { start, end }
}

/**
 * Get IST date range for a given YYYY-MM-DD string.
 */
export function istDateRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS)
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS)
  return { start, end }
}

/**
 * Format a Date for display in IST timezone.
 * Returns something like "Aug 12, 2026, 5:30 PM".
 */
export function formatIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options,
  })
}

/**
 * Get current time in HH:MM format in IST.
 */
export function currentTimeIST(): string {
  const ist = nowIST()
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`
}
