// Settings → Project detail (/api-v2/manage/solution/*) API types.
// Reflects the Go handlers in /opt/drr_its_service/manage/internal/api/handler/
// solution_handler.go and equipment_handler.go verified 2026-07-18.

import type { APIResponseMetaData, ListParams } from './params'

// ── Shared ────────────────────────────────────────────────────────────────────

/** Solution type ids used across the manage service. Numeric because the
 *  backend keys everything off `solution_type_id`. `solution_name_atlas` is
 *  the user-facing label — see /solution/type. */
export const SOLUTION_TYPE = {
  CCTV: 1,
  Counting: 2,          // "Traffic Volume"
  Analytic: 3,          // "Incident Detection"
  Traffic: 4,           // "Traffic Signal"
  Crosswalk: 5,
  Lighting: 6,          // "Traffic Lighting"
  VMS: 7,
  Tunnel: 8,
  WIM: 9,               // "Tracking"
  BridgeLighting: 10,
} as const

export type SolutionTypeID = (typeof SOLUTION_TYPE)[keyof typeof SOLUTION_TYPE]

/** Server-side geometry:
 *  - On POST/PUT the backend accepts GeoJSON `{type:'Point',coordinates:[lng,lat]}`
 *    (WKT strings are rejected with "unable to unmarshal geometry data").
 *  - GET responses may ship as either the GeoJSON object OR a bare
 *    `[lng, lat]` array depending on the endpoint — treat as opaque for
 *    reads. */
export interface GeometryPoint {
  type: 'Point'
  coordinates: [number, number]
}

/** Read-side alias — some endpoints (e.g. GET /cctv/cameras) ship the
 *  point as a bare `[lng, lat]` array instead of the GeoJSON object. */
export type GeometryRead = GeometryPoint | [number, number]

// ── /solution/type ────────────────────────────────────────────────────────────

export interface APIResponseSolutionType {
  id: number
  solution_name: string
  solution_name_atlas: string
}

/** GET /solution/type/{solution_location_id} — solution types PRESENT at
 *  the location, with per-type child counts (cameras / traffic entries /
 *  crosswalk cameras / vms cameras / wim cameras / else 1). */
export interface APIResponseSolutionTypeAtLocation {
  solution_id: number
  solution_name: string
  count: number
}

// ── /solution/road_solution ──────────────────────────────────────────────────

/** One project_road (route) preloaded with its solution locations. The
 *  server names the primary key `project_road_id` (see
 *  `ProjectRoads.ID` `json:"project_road_id"` in the Go model). */
export interface APIResponseRoadSolution {
  project_road_id: number
  project_id: number
  road_id: number
  road?: {
    id: number
    road_code: string
    road_name?: string | null
    province?: string | null
  }
  solution_locations?: APIResponseSolutionLocation[] | null
}

export interface APIResponseSolutionLocation {
  solution_location_id: number
  /** Backend field name is `project_id` per solution_locations.go; carries
   *  the parent project_road_id (misnamed on the model). */
  project_id?: number
  location_name: string
  created_at?: string
  created_by?: string | null
}

export interface APIRequestCreateRoadSolution {
  project_road_id: number
  location_name: string
}

export interface APIRequestUpdateSolutionLocation {
  location_name: string
}

// ── /solution ────────────────────────────────────────────────────────────────

export interface APIResponseSolution {
  id: number
  solution_location_id: number
  solution_type_id: SolutionTypeID
  sta?: string | null
  solution_name: string
  ip_address?: string | null
  zt_ip_address?: string | null
  geometry_point?: GeometryPoint | null
  remarks?: string | null
  anydesk?: string | null
  created_at?: string
  created_by?: string | null
  updated_at?: string
  updated_by?: string | null
  solution_type?: APIResponseSolutionType
}

export interface APIRequestCreateSolution {
  solution_type_id: SolutionTypeID
  solution_location_id: number
  sta: string
  geometry_point: GeometryPoint
  solution_name: string
  zt_ip_address?: string
  ip_address?: string
  anydesk_id?: string
  remarks?: string
  /** REQUIRED when solution_type_id === WIM (9). */
  station_id?: number
  /** REQUIRED (with `lighting_type`) when solution_type_id === Lighting (6). */
  lighting?: APIRequestLightingConfig
  /** REQUIRED when solution_type_id === BridgeLighting (10). */
  bridge_lighting?: APIRequestBridgeLightingConfig
}

/** Bridge-lighting-specific block. Only `wid` persists — the sync worker
 *  refreshes `last_update` on first poll. `wid` is the legacy
 *  tbl_work_master.id used by dashvue's `resolveBridgeKey(wid)` to pick
 *  which SVG template to render, so it must match the shelly device. */
export interface APIRequestBridgeLightingConfig {
  wid: number
}

/** Lighting-specific block. Sent as a nested object on POST /solution when
 *  solution_type_id === 6. `lighting_type=1` (Lora_Gateway) creates the
 *  parent lighting row + a blank lora_status; `lighting_type=2` (IoT4G-67)
 *  additionally creates the tbl_lighting_iot row + all-ok tbl_lighting_iot_status.
 *
 *  connection_type / send_frequency from the Figma spec have NO DB column
 *  yet — omit here until backend adds them (park in `remarks` if the user
 *  really needs to record them). */
export interface APIRequestLightingConfig {
  /** 1 = Lora_Gateway, 2 = IoT4G-67 */
  lighting_type: 1 | 2
  imei?: string
  /** "1p" | "3p" | "1p_cab" — free-text (matches DB free-text column). */
  phase_type?: string
  /** e.g. "nbiot_cab_1p" — sem_type on tbl_lighting_iot. */
  sem_type?: string
  /** e.g. "0STW-1MCB-1PW-1MC-3CB-1TFM-ADJ" */
  diagram_type?: string
  /** ประเภทการเชื่อมต่อ — e.g. "NB-IoT" | "LTE-M" | "WiFi".
   *  Added via 2026-07-18 migration; older backends will ignore it. */
  connection_type?: string
  /** ความถี่การส่งข้อมูล — e.g. "every_5min" | "every_10min" | "hourly". */
  send_frequency?: string
  /** Optional proxy URL override. Blank falls back to the migrator default. */
  proxy_url?: string
}

export interface APIRequestUpdateSolution {
  sta: string
  geometry_point: GeometryPoint
  solution_name: string
  zt_ip_address?: string
  ip_address?: string
  anydesk_id?: string
  remarks?: string
}

// ── Cameras ──────────────────────────────────────────────────────────────────

/** Fields consumed across the different solution-camera-attach endpoints. */
export interface APIRequestSolutionAddCamera {
  solution_id: number
  camera_id: string[] // uuids
}

/** Traffic-signal-specific: each camera also carries phase + camera_type. */
export interface APIRequestSolutionAddCameraTraffic {
  solution_id: number
  cameras: {
    camera_id: string
    phase: number
    camera_type: string
  }[]
}

/** VMS creates the whole VMS solution + its cameras in one call. */
export interface APIRequestCreateVMSSolution {
  solution_id: number
  desktop_screen_url: string
  cameras: {
    camera_name: string
    sta: string
    ip_address?: string
    hls_url: string
    geometry_point: GeometryPoint
    remark?: string
  }[]
}

/** Append cameras to an already-created VMS instance (no delete-first). */
export interface APIRequestSolutionVmsAddCamera {
  vms_id: number
  camera_id: string[]
}

/** Link an already-created WIM Solution to a WIM station. Prefer sending
 *  station_id in the initial /solution create instead. */
export interface APIRequestSolutionWimStation {
  solution_id: number
  station_id: number
}

// ── /solution/camera/crossing_codes/:solution_id ─────────────────────────────

export interface APIResponseCrossingCodes {
  solution_id: number
  master_index_code: string | null
  camera_crossing_index_code: {
    camera_id: string
    camera_name: string
    crossing_index_code: string
  }[]
}

// ── /equipments (Camera list, paginated) ─────────────────────────────────────

export interface APIResponseCamera {
  id: string
  ip_address?: string | null
  department_id?: number | null
  road_id?: number | null
  solution_id?: number | null
  camera_name: string
  sta?: string | null
  hls_url?: string | null
  point_geometry?: GeometryRead | null
  remark?: string | null
  serial_number?: string | null
  model?: string | null
  brand?: string | null
  created_at?: string
  /** ICMP ping reachable — MAY be false while `curl_status` is true when
   *  the camera lives on a NAT/subnet the health-check worker can't reach
   *  but its HLS stream still serves. Don't use this alone to decide the
   *  online badge — use `curl_status` (see mapCamera in the settings
   *  project detail context for canonical rules). */
  ping_status?: boolean
  /** Timestamp of the last successful ICMP ping. Raw model field name is
   *  `ping_updated`; some endpoints (cctv camera detail) surface it as
   *  `ping_updated_at` — both spellings are declared optional. */
  ping_updated?: string | null
  ping_updated_at?: string | null
  /** HLS/curl probe succeeds. This is what dashboards mean by "online". */
  curl_status?: boolean
  /** Timestamp of the last successful HLS probe. Same dual-spelling
   *  situation as ping_updated / ping_updated_at. */
  curl_updated?: string | null
  curl_updated_at?: string | null
  contractor_id?: string | null
  updated_at?: string | null
  solution?: APIResponseSolution & { solution_type?: APIResponseSolutionType }
}

export interface APIResponseCameraListEnvelope {
  res_data: APIResponseCamera[]
  meta_data: APIResponseMetaData
}

/** /equipments query params. `road_id` and `solution_location_id` are
 *  marked `binding:"required"` on the backend DTO — must ALWAYS be sent,
 *  use 0 to mean "no filter". */
export interface EquipmentListParams extends ListParams {
  road_id: number
  solution_location_id: number
  sort?: 'ASC' | 'DESC'
  field?: string
}

// ── Camera list at a solution location ───────────────────────────────────────

/** GET /solution/camera/list/{solution_location_id} — returns the CCTV
 *  cameras attached at that location (via solutions with type_id=1). */
export type APIResponseSolutionCameraList = APIResponseCamera[]

/** GET /solution/camera/vms/{solution_id} — cameras belonging to a
 *  VMS solution. */
export type APIResponseSolutionVmsCameraList = APIResponseCamera[]
