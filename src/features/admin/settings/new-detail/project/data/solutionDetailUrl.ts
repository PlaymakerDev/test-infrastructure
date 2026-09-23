import { buildLightingDetailUrl, resolveLightingImei } from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { SOLUTION_TYPE_CCTV } from './solutionType'
import { SOLUTION_TYPE_LIGHTING } from './lighting'

/** Where the ไปยังหน้าเว็บ column sends the user when a solution name is clicked.
 *
 *  There is no shared query-param shape across the ten menus — surveyed
 *  2026-09-23, every detail page reads a different set:
 *
 *    CCTV (1)                       dept_id
 *    Traffic Volume (2)             dept_id + project_id + road_id
 *    Incident Detection (3)         dept_id + project_id + road_id
 *    Traffic Signal (4)             dept_id + project_id + road_id
 *    Crosswalk (5)                  dept_id + project_id + road_id
 *    Traffic Lighting (6)           dept_id + imei + type — path id is the
 *                                   IMEI, not the solution id
 *    VMS (7)                        is_warranty + is_online, and NO dept_id
 *    Tunnel (8)                     no page in this app at all
 *    Tracking / WIM (9)             path id is wim.station_id, not solution id
 *    Bridge Lighting (10)           dept_id + project_id + is_warranty
 *
 *  So this is a switch, not a template. The two types this page cannot address
 *  come back as `blocked` instead of a link that would open the wrong record.
 */

/** Solution-type ids as the table's rows carry them (`solution_type.id`).
 *  Mirrors SOLUTION_TYPE in @/types/manage/solution-api — kept local for the
 *  same reason `data/solutionType.ts` keeps SOLUTION_TYPE_CCTV local. */
export const DETAIL_SOLUTION_TYPE = {
  CCTV: SOLUTION_TYPE_CCTV,
  COUNTING: 2,
  ANALYTIC: 3,
  TRAFFIC: 4,
  CROSSWALK: 5,
  LIGHTING: SOLUTION_TYPE_LIGHTING,
  VMS: 7,
  TUNNEL: 8,
  WIM: 9,
  BRIDGE_LIGHTING: 10,
} as const

/** The four menus that share one URL shape: dept_id + project_id + road_id.
 *  Their detail pages self-derive project/road from the central list when the
 *  params are absent, but passing them saves the Project-Info modal a refetch. */
const ROAD_SCOPED_ROUTE: Record<number, string> = {
  [DETAIL_SOLUTION_TYPE.COUNTING]: 'traffic-volume',
  [DETAIL_SOLUTION_TYPE.ANALYTIC]: 'incident-detection',
  [DETAIL_SOLUTION_TYPE.TRAFFIC]: 'traffic-signal',
  [DETAIL_SOLUTION_TYPE.CROSSWALK]: 'crosswalk',
}

export interface SolutionDetailContext {
  /** `road.department_id` — the solution's OWN bureau, not the logged-in user's.
   *
   *  Required by every route except VMS, and its absence is NOT harmless:
   *  `useDeptId()` falls back to dept 50 when `?dept_id=` is missing, so a link
   *  without it renders another bureau's data instead of failing loudly. */
  deptId?: number | string | null
  projectId?: number | string | null
  roadId?: number | string | null
  /** `project.is_warranty` from `GET /manage/project/{id}` — VMS and Bridge
   *  Lighting render their warranty pill straight off the query param. */
  isWarranty?: boolean | null
}

/** The subset of a traffic-lighting central-list row needed to address its
 *  detail page. Shaped after `TrafficLightingProject` so a row from
 *  `mapCentralListToProjects` can be passed straight in. */
export interface LightingRowRef {
  /** The list row id — the IMEI when the device reports one, otherwise a
   *  synthetic `<solutionId>-<n>`. */
  id: string
  imei?: string
  /** `'lamp'` picks the lamp layout; anything else is a controller cabinet. */
  equipmentType?: string | null
}

export type SolutionDetailTarget =
  /** Ready to navigate. */
  | { kind: 'ready'; href: string }
  /** Traffic Lighting — addressed by IMEI, which lives in the lighting
   *  central list rather than on the solution row. The caller looks the row up
   *  and calls {@link buildLightingSolutionHref}. */
  | { kind: 'needs-lighting-row' }
  /** No correct URL exists from this page. `reason` is shown to the user
   *  instead of a link. */
  | { kind: 'blocked'; reason: string }

const asId = (value: number | string | null | undefined): string | null => {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  // 0 is the context's not-loaded-yet sentinel (INIT_ROAD / INIT_ROAD_SOLUTION),
  // never a real road or project id.
  return text === '' || text === '0' ? null : text
}

export const buildSolutionDetailUrl = (
  solutionTypeId: number,
  solutionId: number | string,
  ctx: SolutionDetailContext,
): SolutionDetailTarget => {
  if (solutionTypeId === DETAIL_SOLUTION_TYPE.TUNNEL) {
    return {
      kind: 'blocked',
      reason: 'อุโมงค์ไม่มีหน้ารายละเอียดในระบบนี้ — เปิดผ่านลิงก์ควบคุมของอุโมงค์ในเมนูอุโมงค์',
    }
  }

  if (solutionTypeId === DETAIL_SOLUTION_TYPE.WIM) {
    return {
      kind: 'blocked',
      reason: 'หน้า WIM อ้างอิงด้วยเลขสถานี (station_id) ไม่ใช่ solution_id ซึ่งหน้านี้ยังหาไม่ได้',
    }
  }

  // VMS is the one route that reads no dept_id at all — check it before the
  // dept guard below, or every VMS row would be blocked for the wrong reason.
  if (solutionTypeId === DETAIL_SOLUTION_TYPE.VMS) {
    // `is_online` is deliberately omitted: this page has no live status, and
    // the detail page reads a missing flag as false either way. The warranty
    // pill would otherwise always read หมดประกัน, so pass that one.
    const query = ctx.isWarranty == null ? '' : `?is_warranty=${String(ctx.isWarranty)}`
    return { kind: 'ready', href: `/admin/vms/detail/${solutionId}${query}` }
  }

  const deptId = asId(ctx.deptId)
  if (!deptId) {
    return {
      kind: 'blocked',
      reason: 'ยังไม่ทราบหน่วยงานของสายทางนี้ จึงยังเปิดหน้ารายละเอียดไม่ได้',
    }
  }

  if (solutionTypeId === DETAIL_SOLUTION_TYPE.CCTV) {
    // CCTV is filtered out of GET /manage/solution (one solution per
    // โครงการ+สายทาง, managed in the road-level panel), so no row should reach
    // here — mapped anyway so a backend change doesn't silently produce a
    // dead link.
    return { kind: 'ready', href: `/admin/cctv/detail/${solutionId}?dept_id=${deptId}` }
  }

  if (solutionTypeId === DETAIL_SOLUTION_TYPE.LIGHTING) {
    return { kind: 'needs-lighting-row' }
  }

  if (solutionTypeId === DETAIL_SOLUTION_TYPE.BRIDGE_LIGHTING) {
    const params = new URLSearchParams({ dept_id: deptId })
    const projectId = asId(ctx.projectId)
    if (projectId) params.set('project_id', projectId)
    if (ctx.isWarranty != null) params.set('is_warranty', String(ctx.isWarranty))
    return { kind: 'ready', href: `/admin/bridge-lighting/detail/${solutionId}?${params}` }
  }

  const route = ROAD_SCOPED_ROUTE[solutionTypeId]
  if (!route) {
    return { kind: 'blocked', reason: `ยังไม่รองรับประเภทงานนี้ (type ${solutionTypeId})` }
  }

  const params = new URLSearchParams({ dept_id: deptId })
  const projectId = asId(ctx.projectId)
  const roadId = asId(ctx.roadId)
  if (projectId) params.set('project_id', projectId)
  if (roadId) params.set('road_id', roadId)
  return { kind: 'ready', href: `/admin/${route}/detail/${solutionId}?${params}` }
}

/** Traffic Lighting's own URL, built from the device's central-list row.
 *
 *  Delegates to the traffic-lighting feature's builder so the settings link and
 *  the lighting table's own row click produce byte-identical URLs — including
 *  the `/detail/lamp/` branch, which depends on `equipmentType` and would
 *  otherwise open a โคมไฟ device on the controller-cabinet layout. */
export const buildLightingSolutionHref = (
  row: LightingRowRef,
  deptId: number | string,
): string =>
  buildLightingDetailUrl({
    routeId: row.id,
    imei: resolveLightingImei(row.id, row.imei),
    type: row.equipmentType ?? '',
    deptId,
  })
