// Pure helpers extracted from `reportvolume/index.tsx`.
// Each function below is dependency-free and easy to unit-test — keeping
// them out of the orchestrator file makes the file shorter AND opens up
// snapshot/property-style tests on the math without mounting React.

import type { CountingReportSummaryRow } from '@/types/traffic-volume/detail-api'
import type {
  DailyReportSummary,
  HourlyReportCameraGroup,
  HourlyReportRow,
} from '@/features/admin/traffic-volume/detail/components/section/reportvolume/data/reportMock'

/** Empty placeholder summary used while the API is loading / disabled —
 *  keeps the stats row laid out so the user sees the skeleton instead of
 *  a layout jump when data arrives. */
export const EMPTY_DAILY_SUMMARY: DailyReportSummary = {
  daysCount: 0,
  totalVehicles: 0,
  totalPCU: 0,
  avgVehiclesPerDay: 0,
  avgPCUPerDay: 0,
  maxVehiclesPerDay: 0,
  maxPCUPerDay: 0,
  truckPercent: 0,
}

/** Compute the 8-KPI summary directly from wire rows. Shared by daily and
 *  hourly modes — the field shape is identical, only the count semantics
 *  differ ("จำนวนวัน" vs "จำนวนรายการ"). Single pass; avoids the four
 *  separate `.reduce` walks the inline version did. */
export const computeReportSummary = (
  rows: CountingReportSummaryRow[]
): DailyReportSummary => {
  if (rows.length === 0) return EMPTY_DAILY_SUMMARY
  let totalVehicles = 0
  let totalPCU = 0
  let maxVehicles = 0
  let maxPCU = 0
  let truckShareSum = 0
  for (const r of rows) {
    totalVehicles += r.total_count
    totalPCU += r.total_pcu
    if (r.total_count > maxVehicles) maxVehicles = r.total_count
    if (r.total_pcu > maxPCU) maxPCU = r.total_pcu
    // `percent_truck` arrives in 0–1; rescale to 0–100 once at the end
    // after taking the mean so we accumulate at wire-scale.
    truckShareSum += r.percent_truck
  }
  const n = rows.length
  return {
    daysCount: n,
    totalVehicles,
    totalPCU,
    avgVehiclesPerDay: totalVehicles / n,
    avgPCUPerDay: totalPCU / n,
    maxVehiclesPerDay: maxVehicles,
    maxPCUPerDay: maxPCU,
    truckPercent: (truckShareSum / n) * 100,
  }
}

/** Compute the visible page list with ellipses inserted around the current
 *  page — mirrors the design's "1 2 3 4 5 …" pattern. Returns a mix of
 *  page numbers and the sentinel string `'...'` for the rendered ellipsis. */
export const buildPageList = (
  current: number,
  total: number
): Array<number | '...'> => {
  if (total <= 6) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  // Window of 5 page numbers around the current page, clamped to [1, total].
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  const pages: Array<number | '...'> = []
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total) pages.push('...')
  return pages
}

/** Adapter from wire row → hourly UI row. Kept here so callers can pass it
 *  into `groupByCamera` without each having to redeclare the mapper. */
const toHourlyRow = (r: CountingReportSummaryRow): HourlyReportRow => ({
  hourTimestamp: r.date,
  motorcycle: r.bike_count,
  car: r.car_count,
  pickup: r.pickup_count,
  taxi: r.taxi_count,
  bus: r.bus_count,
  truck: r.truck_count,
  trailer: r.trailer_count,
  totalVehicles: r.total_count,
  totalPCU: r.total_pcu,
  truckPercent: r.percent_truck * 100,
})

/** Group hour-mode rows by their source camera so the table can render one
 *  header + N hour rows per group. Map keeps insertion order so cameras
 *  appear in the same order the API returned them.
 *
 *  Two defenses against bad input:
 *  • Rows without a `camera_name` are dropped — backend can emit total /
 *    aggregate rows that don't belong under any single-camera header, and
 *    rendering them as orphans confuses the per-camera pagination.
 *  • Rows are deduped by `(camera_name, date)` — both the backend and the
 *    infinite-fetch loop can occasionally surface the same hour bucket
 *    twice; the table is "first wins" so we keep the first occurrence. */
export const groupByCamera = (
  rows: CountingReportSummaryRow[]
): HourlyReportCameraGroup[] => {
  const groups = new Map<string, CountingReportSummaryRow[]>()
  const seen = new Set<string>()
  for (const r of rows) {
    const cam = r.camera_name?.trim()
    if (!cam) continue
    const dedupKey = `${cam}|${r.date}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    if (!groups.has(cam)) groups.set(cam, [])
    groups.get(cam)!.push(r)
  }
  return Array.from(groups.entries()).map(([cameraName, items]) => ({
    cameraName,
    hoursCollected: items.length,
    rows: items.map(toHourlyRow),
  }))
}
