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
  /** Road code, e.g. "ชม.3035" (BE `road.road_code`). */
  road: string
  /** Friendly road name (BE `road.road_name`) — shown in the popup subtitle. */
  landmark: string
}
