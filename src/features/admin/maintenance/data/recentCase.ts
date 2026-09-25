import dayjs from 'dayjs'
import type { CaseStatus } from '@/types/maintenance'

/** After a week a case stops announcing itself even if nobody ever worked it —
 *  at that point it's a backlog item, not news. */
export const NEW_CASE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Should this case carry the "new" chip?
 *
 *  Purely the case's OWN state: nobody has filed anything against it yet
 *  (`status === 'open'` — the backend moves it to `in_progress` on the
 *  contractor's first save) and it was reported less than a week ago.
 *
 *  Deliberately NOT a per-browser record of what was clicked. Two earlier
 *  attempts did that and both failed the same way: a sessionStorage marker
 *  only existed in the tab that wrote it, and a localStorage one made the chip
 *  come back on every new browser, every incognito window and every second
 *  device, while one account's reading silently cleared the chip for whoever
 *  logged in next on that machine (user 2026-09-22). Reading the case's status
 *  means every officer and every vendor sees the same truth everywhere.
 *
 *  `reported_at` arrives as "2026-09-22 11:17:03" — no zone, already Thai
 *  local time, which is how dayjs parses it here.
 */
export const isNewCase = (
  status: CaseStatus | undefined,
  reportedAt: string | null | undefined,
  now: number = Date.now(),
): boolean => {
  // Anything past `open` has been worked on; a row with no status at all is
  // too old to reason about, so it gets no chip either.
  if (status !== 'open') return false
  if (!reportedAt) return false
  const opened = dayjs(reportedAt)
  if (!opened.isValid()) return false
  return opened.valueOf() > now - NEW_CASE_MAX_AGE_MS
}
