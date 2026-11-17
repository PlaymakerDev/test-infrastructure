import type { DeviceTotals, ProjectDeviceSolutionsRow, ProjectDeviceSummaryRow } from '@/types/manage/device-status-api'
import { hasDevices } from './deviceStatus'
import { SUMMARY_SYSTEMS, type SummarySystem } from './systems'

/** รวมผู้รับจ้าง (user 2026-10-29): every contractor's expired-warranty
 *  projects in one report, read from /device-status/summary and /solutions
 *  without contractor_id. */

/** A placeholder: a project with no warranty end date — the department's own
 *  installations (นธ.2031, สห.3026 …) and a contractor's not yet filled in
 *  (สป.1006), project_no "Temp…" most of them. หมดค้ำ to the backend is "not
 *  in warranty today", so they land there though nothing ran out; the report
 *  leaves them out (user 2026-10-29). */
export const isPlaceholder = (row: Pick<ProjectDeviceSummaryRow, 'warranty_end_date'>) => !row.warranty_end_date

/** One thing a ring counts, whether it is up, and whether it is
 *  นอกเหนือการรับประกัน (an open record). */
interface RingUnit {
  key: string
  online: boolean
  outOfWarranty: boolean
}

const anyOnline = (items: { is_online: boolean }[] | null | undefined) => (items ?? []).some((item) => item.is_online)
const anyRecorded = (items: { is_out_of_warranty?: boolean }[] | null | undefined) =>
  (items ?? []).some((item) => !!item.is_out_of_warranty)

/** What each ring counts, in the units of its uptime-statistics: CCTV each
 *  camera; Traffic Volume, Incident Detection, LPR and Tunnel each install
 *  point, up while any of its cameras or sensors is; the rest each
 *  controller, sign, cabinet or bridge. นอกเหนือการรับประกัน as uptime-statistics
 *  counts it (BE 2026-11-16): a camera's own record; a sign's, cabinet's,
 *  controller's, bridge's or tunnel's (BE 2026-11-17) solution's; an install
 *  point (and a crosswalk) through any camera of its. */
const RING_UNITS: Record<string, (row: ProjectDeviceSolutionsRow) => RingUnit[]> = {
  cctv: (row) =>
    (row.cctv ?? []).flatMap((point) =>
      (point.cameras ?? []).map((camera) => ({ key: camera.id, online: camera.is_online, outOfWarranty: !!camera.is_out_of_warranty })),
    ),
  vms: (row) => (row.vms ?? []).map((sign) => ({ key: String(sign.id), online: sign.is_online, outOfWarranty: !!sign.is_out_of_warranty })),
  lighting: (row) =>
    (row.lighting ?? []).map((cabinet) => ({ key: String(cabinet.id), online: cabinet.is_online, outOfWarranty: !!cabinet.is_out_of_warranty })),
  counting: (row) =>
    (row.counting ?? []).map((point) => ({ key: String(point.solution_id), online: anyOnline(point.cameras), outOfWarranty: anyRecorded(point.cameras) })),
  analytic: (row) =>
    (row.analytic ?? []).map((point) => ({ key: String(point.solution_id), online: anyOnline(point.cameras), outOfWarranty: anyRecorded(point.cameras) })),
  traffic: (row) =>
    (row.traffic ?? []).map((controller) => ({ key: String(controller.id), online: controller.is_online, outOfWarranty: !!controller.is_out_of_warranty })),
  lpr: (row) =>
    (row.lpr ?? []).map((point) => ({ key: String(point.solution_id), online: anyOnline(point.cameras), outOfWarranty: anyRecorded(point.cameras) })),
  bridge_lighting: (row) =>
    (row.bridge_lighting ?? []).map((bridge) => ({ key: String(bridge.id), online: bridge.is_online, outOfWarranty: !!bridge.is_out_of_warranty })),
  crosswalk: (row) =>
    (row.crosswalk ?? []).map((controller) => ({
      key: String(controller.id),
      online: controller.is_online,
      outOfWarranty: !!controller.is_out_of_warranty || anyRecorded(controller.cameras),
    })),
  tunnel: (row) =>
    (row.tunnel ?? []).map((tunnel) => ({
      key: String(tunnel.solution_id),
      online: anyOnline(tunnel.devices),
      // Recorded per solution since BE 2026-11-17; its devices carry it too.
      outOfWarranty: !!tunnel.is_out_of_warranty || anyRecorded(tunnel.devices),
    })),
}

/** Each counted once — a camera two projects share too. As the page's rings
 *  (option ก., user 2026-11-16), an offline unit with a record leaves both
 *  ทั้งหมด and ออฟไลน์. */
const tally = (units: RingUnit[]): DeviceTotals => {
  const byKey = new Map<string, { online: boolean; outOfWarranty: boolean }>()
  for (const unit of units) {
    const seen = byKey.get(unit.key)
    byKey.set(unit.key, {
      online: (seen?.online ?? false) || unit.online,
      outOfWarranty: (seen?.outOfWarranty ?? false) || unit.outOfWarranty,
    })
  }
  const counted = [...byKey.values()].filter((unit) => unit.online || !unit.outOfWarranty)
  const online = counted.filter((unit) => unit.online).length
  return { total: counted.length, online, offline: counted.length - online }
}

/** The rings counted from the report's own projects, so a project the report
 *  leaves out takes its devices with it — the uptime-statistics endpoints
 *  can't leave out a project. Matched them for every system (2026-10-29, หมดค้ำ,
 *  every contractor) but Traffic Volume, where uptime counts an install point
 *  once per road its cameras stand on (38 against 36 points). */
export const solutionRings = (solutions: ProjectDeviceSolutionsRow[]): { system: SummarySystem; totals: DeviceTotals }[] =>
  SUMMARY_SYSTEMS.flatMap((system) => {
    const units = RING_UNITS[system.key]
    const totals = units ? tally(solutions.flatMap(units)) : null
    return hasDevices(totals) ? [{ system, totals }] : []
  })

/** The report's projects (all but the placeholders), their devices and the
 *  rings over them. */
export const allContractorsReport = (summary: ProjectDeviceSummaryRow[], solutions: ProjectDeviceSolutionsRow[]) => {
  const kept = summary.filter((row) => !isPlaceholder(row))
  const ids = new Set(kept.map((row) => row.project_id))
  const keptSolutions = solutions.filter((row) => ids.has(row.project_id))
  return { summary: kept, solutions: keptSolutions, rings: solutionRings(keptSolutions) }
}
