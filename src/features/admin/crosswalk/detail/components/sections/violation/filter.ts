// Shared filter shape for the violation section — owned by `ViolationSection`
// and consumed by `FormSearchViolation`, `TableViolationData`, and
// `ViolationStatCard`. Dates are stored as `YYYY-MM-DD` strings so they can
// be passed straight to the API without another dayjs round-trip.
import dayjs from 'dayjs'

export type ViolationPeriod =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'ALL'

export type ViolationStatus =
  | 'PEDESTRIAN_VIOLATION'
  | 'VEHICLE_VIOLATION'
  | 'ALL'

export interface ViolationFilter {
  /** YYYY-MM-DD. Empty string when `period === 'ALL'` — treated as "no date
   *  filter" so the API request omits the param. */
  startDate: string
  /** YYYY-MM-DD. Empty string when `period === 'ALL'`. */
  endDate: string
  /** UI marker for the active preset. `'ALL'` doubles as "custom range" —
   *  when the user drags the RangePicker directly, we clear it back to
   *  `'ALL'` since none of the preset buttons apply anymore. */
  period: ViolationPeriod
  status: ViolationStatus
}

/** Compute start/end for a given preset. `ALL` returns empty strings so the
 *  request omits both params and the backend returns everything it has. */
export const dateRangeForPeriod = (
  period: ViolationPeriod,
): { startDate: string; endDate: string } => {
  const today = dayjs()
  const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD')
  switch (period) {
    case 'TODAY':
      return { startDate: fmt(today), endDate: fmt(today) }
    case 'YESTERDAY': {
      const y = today.subtract(1, 'day')
      return { startDate: fmt(y), endDate: fmt(y) }
    }
    case 'LAST_7_DAYS':
      return {
        startDate: fmt(today.subtract(6, 'day')),
        endDate: fmt(today),
      }
    case 'THIS_MONTH':
      return {
        startDate: fmt(today.startOf('month')),
        endDate: fmt(today),
      }
    case 'ALL':
      return { startDate: '', endDate: '' }
  }
}

/** Backend's `crosswalk_type` mapping — verified LIVE against
 *  /crosswalk/solutions/{id}/details/list on 2026-07-21 (2 → 939 คน rows,
 *  3 → 14,263 รถ rows, partitioning the 15,202 baseline exactly). The param
 *  name is crosswalk_type — the old code sent `crossing_type`, which the
 *  backend silently ignored and forced a client-side walk. */
export const CROSSING_TYPE_MAP: Record<
  Exclude<ViolationStatus, 'ALL'>,
  number
> = {
  PEDESTRIAN_VIOLATION: 2,
  VEHICLE_VIOLATION: 3,
}

/** Initial filter — TODAY + ALL status matches the "current-day snapshot on
 *  first render" default; user can widen the range from there. */
export const defaultViolationFilter = (): ViolationFilter => ({
  ...dateRangeForPeriod('TODAY'),
  period: 'TODAY',
  status: 'ALL',
})
