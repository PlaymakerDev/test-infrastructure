import type { SystemType } from "./systems"

/** Device shape used by every dashboard-map marker layer. Fields are sourced
 *  from `/manage/solution/{deptId}/position` in production. The previous
 *  `generateDevices()` mock has been removed — the live API now feeds the
 *  same shape directly. */
export type Device = {
  /** Solution id (unique per device). */
  id: string
  /** Normalised FE system type (matches `SystemType` in `systems.ts`). */
  type: SystemType
  /** Department id (BE `road.department_id`) — drives Breadcrumb's "ขทช." line. */
  unitId: number
  /** สทช. number 0–21 (BE `road.stch`) — drives the country-level summary markers. */
  stch: number
  /** [lng, lat] — BE `geometry_point`. */
  coord: [number, number]
  /** Road id (BE `road.id`) — passed as `road_id` to the detail link. */
  roadId: number
  /** Road code, e.g. "ชม.3035" (BE `road.road_code`) — popup "สายทาง" line. */
  road: string
  /** Friendly road name (BE `road.road_name`). */
  landmark: string
  /** จุดติดตั้ง = solution name (BE `solution.solution_name`) — popup line. */
  solutionName: string
  /** Online/offline state — sourced by BE from each solution type's authoritative
   *  status table (cctv.tbl_camera.curl_status, traffic.tbl_traffic_status,
   *  lighting.tbl_lighting_iot_status, wim.tbl_wim.wim_connected_at, bridge_lighting).
   *  `true` = online, `false` = offline, `undefined` = BE didn't ship the field yet
   *  (map falls back to the normal solid colour). */
  isOnline?: boolean
  /** Id to use in the popup's detail link when it differs from `id`. LPR
   *  devices come from GET /lpr/points (not /position) and prefix their `id`
   *  with `lpr-` so a point that is ALSO a /position solution (LPR rides on
   *  existing cameras) can't collide in marker keys — the detail page still
   *  needs the bare solution_id. */
  detailId?: string
}
