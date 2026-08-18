// Crosswalk — Detail page API types
// Verified against: GET /crosswalk/departments/{deptId}/cameras

import type { MetaData } from '../shared'

// ── GET /crosswalk/departments/{deptId}/cameras ──────────────────────────────
// Per-solution camera list — drives the detail page's camera table + grid.
// `solution_id` narrows the response to a single solution when set.

export interface APIRequestCrosswalkCameras {
  solution_id?: string | number
}

/** Per-camera solution participation returned on the crosswalk cameras
 *  endpoint — a non-null field means the camera does that solution (drives the
 *  การทำงาน badges). Note: uses `solution_id` (not `id` like SharedSolution). */
export interface CrosswalkCameraSolution {
  solution_id: number
  solution_name: string
}

export interface CrosswalkCameraItem {
  id: string
  camera_name: string
  hls_url: string
  /** [lng, lat] — used by the detail map to place a marker per camera. */
  geometry_point: [number, number]
  /** Optional — backend may not expose it on this endpoint yet. */
  ip_address?: string
  /** Online status (BE added 2026-07-03) — drives the Stream/Device status. */
  is_online: boolean
  // Solution participation flags (BE added 2026-07-03) — null when the camera
  // doesn't do that solution. Replaces the old per-camera /cctv/cameras/{id}
  // lookup for การทำงาน badges.
  counting: CrosswalkCameraSolution | null
  analytic: CrosswalkCameraSolution | null
  traffic: CrosswalkCameraSolution | null
  crosswalk: CrosswalkCameraSolution | null
  wim_camera: CrosswalkCameraSolution | null
  vms: CrosswalkCameraSolution | null
}

export interface APIResponseCrosswalkCameras {
  cameras: CrosswalkCameraItem[]
  /** [lng, lat] — average position of the cameras; used to center the map.
   *  Optional because the current backend sample doesn't return it yet. */
  centroid?: [number, number] | null
}

// ── GET /crosswalk/solutions/{id}/details?start_date=YYYY-MM-DD ──────────────
// Daily summary for the detail-page InfoCard rail. `crossing.*` covers the
// pedestrian side (total crossings, button presses, red-light violations);
// `counting.*` covers the vehicle side (count, PCU, avg speed).

export interface APIRequestCrosswalkSummaryDaily {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  start_date?: string
  /** YYYY-MM-DD. Optional — when set together with `start_date`, backend
   *  returns the aggregate across the range (used by the ViolationStatCard
   *  when the user picks a multi-day filter like "7 วันที่ผ่านมา" or "เดือนนี้"). */
  end_date?: string
}

export interface APIResponseCrosswalkSummaryDaily {
  crossing: {
    total: number
    button_pressed: number
    violation: number
    /** Vehicles that ran the red light at this crosswalk (BE added 2026-07-06). */
    red_light_violation: number
  }
  counting: {
    total_count: number
    total_pcu: number
    avg_speed: number
  }
}

// ── GET /crosswalk/solutions/{id}/details/graph?start_date=YYYY-MM-DD ────────
// Hourly time-series for the two charts on the detail page. Each bucket's
// `hour_timestamp` is an ISO string with +07:00 offset; parse with dayjs and
// format for the X-axis label.

export interface APIRequestCrosswalkGraph {
  solution_id: string | number
  /** YYYY-MM-DD. Omit to let the backend default to today. */
  start_date?: string
}

export interface CrosswalkCrossingBucket {
  hour_timestamp: string
  total_pedestrians: number
  button_pressed: number
}

export interface CrosswalkViolationBucket {
  hour_timestamp: string
  /** Pedestrians who crossed without pressing the request button. */
  unbuttoned_crossing: number
  /** Red-light violations by vehicles at this crosswalk. */
  red_light_violation: number
}

export interface APIResponseCrosswalkGraph {
  crossing_stats: CrosswalkCrossingBucket[]
  violation_stats: CrosswalkViolationBucket[]
}

// ── GET /crosswalk/solutions/{id}/details/list?start_date=…&end_date=… ───────
// Paginated violation events for the ViolationSection table on the detail page.
// Filters: crosswalk_type (2=คนฝ่าฝืน, 3=รถฝ่าฝืน — verified live 2026-07-21), search,
// field+sort. Backend defaults page=1, limit=10.

export interface APIRequestCrosswalkViolationList {
  solution_id?: string | number
  /** YYYY-MM-DD */
  start_date?: string
  /** YYYY-MM-DD */
  end_date?: string
  /** Filter by violation type — backend param name is crosswalk_type (2=คน, 3=รถ). */
  crosswalk_type?: string | number
  search?: string
  /** Column name to sort by (e.g. "ip_address"). */
  field?: string
  sort?: 'ASC' | 'DESC'
  page?: number
  limit?: number
}

export interface CrosswalkViolationRow {
  crosswalk: {
    type: number
    name_en: string
    /** Thai event label — used directly as the pill text. */
    name_th: string
    /** Pre-formatted Thai date-time, e.g. "22/06/2569 16:24". */
    timestamp: string
  }
  camera: {
    id: string
    name: string
    /** Camera station / IP-ish field. Empty string when not set. */
    sta: string
    /** Real camera IP — BE added 2026-08 (verified live 2026-08-17,
     *  e.g. "10.2.1.4"). Optional so older payloads still parse; render
     *  with a '-' fallback. Replaces the old cameras-list ip lookup. */
    camera_ip?: string
  }
  /** Full URL to the captured event image. */
  image_path: string
}

export interface APIResponseCrosswalkViolationList {
  res_data: CrosswalkViolationRow[]
  /** Standard pagination envelope used across the project's paginated
   *  endpoints (incident-detection, cctv, lighting, …). Fields:
   *  `count` (total rows), `page`, `limit`, `total_pages`. */
  meta_data?: MetaData
}

// ── GET /manage/solution/details/{id} ────────────────────────────────────────
// Solution-level admin metadata — same shared endpoint used by traffic-volume
// and traffic-signal. We only consume `anydesk` for the title bar; everything
// else is informational.

export interface APIResponseCrosswalkSolutionDetail {
  id: number
  solution_name: string
  /** Empty string means "no AnyDesk configured" — render the button muted. */
  anydesk: number | string | null
  geometry_point: [number, number] | null
}
