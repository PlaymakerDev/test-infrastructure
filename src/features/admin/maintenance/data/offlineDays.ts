import dayjs from 'dayjs'

/** Go's zero-value time ("0001-01-01T00:00:00Z", any offset) — the backend's
 *  way of saying "never actually recorded", not a real timestamp. */
export const isRealTimestamp = (value: string | null | undefined): boolean =>
  !!value && !value.startsWith('0001-01-01')

/** Days a device has been unreachable.
 *
 *  `backendDays` (history's `offline_days`) wins whenever it is a real count:
 *  the 2026-09-16 backend release started computing it, and it is the only
 *  trustworthy source — `curl_updated_at` marks the last health CHECK, which
 *  keeps moving while a device stays offline, so deriving from it reads 0 for
 *  everything. The timestamp is still the fallback for endpoints that ship no
 *  day count at all (the solution list and a case's `cameras[]`). */
export const offlineDaysSince = (
  curlUpdatedAt: string | null | undefined,
  backendDays = 0,
): number => {
  if (backendDays > 0) return backendDays
  if (!isRealTimestamp(curlUpdatedAt)) return backendDays
  const lastSeen = dayjs(curlUpdatedAt)
  if (!lastSeen.isValid()) return backendDays
  return Math.max(0, dayjs().diff(lastSeen, 'day'))
}
