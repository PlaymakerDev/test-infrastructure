// A leaf row carries a compact id for navigation while keeping the display
// label separate. Legacy string entries remain supported by the shared map
// UI, but every live statistics adapter currently emits the object form.
export type RouteDetailEntry = string | {
  label: string
  id: string | number
  connected?: boolean
  is_online?: boolean
  line_check_fail?: boolean
  circuit_fail?: boolean
  volt_amp_fail?: boolean
  /** For opening ProjectInfoModal (ⓘ) — the project + road behind this solution. */
  projectId?: number
  roadId?: number
  /** Whether this solution is still under warranty (drives the ในค้ำ/หมดค้ำ pill). */
  is_warranty?: boolean
  /** VMS-only — Anydesk remote-access id, shown on the status detail page. */
  anydesk?: string
  /** VMS-only — live HLS stream URL for the sign's own desktop/display preview. */
  desktopScreen?: string
  /** VMS-only — `solution_id` (distinct from `id`/vms_id), needed for `GET /vms/details/{solution_id}`. */
  solutionId?: number
}

export interface RouteSubDepartment {
  label: string
  detail: RouteDetailEntry[]
  connected: boolean
  /** Displayed as online/total. */
  count?: string
  /** Sum of noti_count across all solutions/devices under this แขวง — backs the
   *  sub-level badge (mirrors RouteItem.notiTotal one level down). */
  notiTotal?: number
}

export interface RouteItem {
  id?: string | number
  name: string
  /** Displayed as online/total. */
  count: string
  lngLat: [number, number] | null
  sub3: RouteSubDepartment[]
  /** Sum of noti_count across all solutions under this bureau. */
  notiTotal?: number
}

// Shared nav-key helpers keep map markers, the search list and detail pages on
// the same compact identifiers.
export const routeKey = (item: RouteItem) => String(item.id ?? item.name)
export const detailLabel = (detail: RouteDetailEntry) =>
  typeof detail === 'string' ? detail : detail.label
export const detailKey = (detail: RouteDetailEntry) =>
  typeof detail === 'string' ? detail : String(detail.id)

/** One real point per leaf, decoupled from the coarser search-list grouping. */
export interface MapMarkerItem {
  routeKey: string
  detailKey: string
  lngLat: [number, number]
  /** Numeric value shown on the point / summed on its cluster bubble. */
  count: number
  /** When supplied, offline status controls marker colour instead of count. */
  offline?: boolean
}
