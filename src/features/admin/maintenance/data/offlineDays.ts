import dayjs from 'dayjs'

/** Go's zero-value time ("0001-01-01T00:00:00Z", any offset) — the backend's
 *  way of saying "never actually recorded", not a real timestamp. */
export const isRealTimestamp = (value: string | null | undefined): boolean =>
  !!value && !value.startsWith('0001-01-01')

/** Days a device has been unreachable, derived from `curl_updated_at` (the last
 *  time a health check actually succeeded) against now.
 *
 *  The maintenance history endpoint returns `offline_days: 0` for every case —
 *  it never computes the field — so the count has to come from the timestamp.
 *  A device that came back online carries a fresh `curl_updated_at`, which makes
 *  this naturally read 0 again; no separate online/offline flag is needed.
 *
 *  `fallback` is used when the timestamp is missing or is the Go zero value, so
 *  a backend that does start populating `offline_days` wins automatically. */
export const offlineDaysSince = (
  curlUpdatedAt: string | null | undefined,
  fallback = 0,
): number => {
  if (!isRealTimestamp(curlUpdatedAt)) return fallback
  const lastSeen = dayjs(curlUpdatedAt)
  if (!lastSeen.isValid()) return fallback
  return Math.max(0, dayjs().diff(lastSeen, 'day'))
}
