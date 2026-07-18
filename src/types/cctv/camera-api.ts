// CCTV — Camera-level API types
// Source: https://its.drr.go.th/api-v2/docs/cctv  (OpenAPI `cctv`)
//
// Camera endpoints return individual cameras (not solution-level rollups).
// Solution/route-level types live in `overview-api.ts`.

import type { MetaData } from '../shared'
import type { CctvCameraCount } from './overview-api'

// ── GET /cctv/departments/{id}/cameras ────────────────────────────────────────
// Map markers (one per camera) + centroid.

export interface APIRequestCCTVCameras {
  solution_id?: number | string
  road_code?: string
}

export interface CCTVCameraItem {
  id: string
  camera_name: string
  hls_url: string
  geometry_point: [number, number] | null
}

export interface APIResponseCCTVCameras {
  cctv: CCTVCameraItem[]
  centroid: [number, number] | null
}

// ── GET /cctv/departments/{id}/cameras/list ───────────────────────────────────
// Paginated camera list (feeds the search page table / grid).

export interface APIRequestCCTVCameraList {
  solution_id?: number | string
  road_code?: string
  status_name?: string
  warranty_name?: string
  limit?: number
  page?: number
  sort?: string
  field?: string
  search?: string
}

export interface CCTVCameraStatus {
  is_online: boolean
  name: string
}

export interface CCTVCameraWarranty {
  is_warranty: boolean
  name: string
}

export interface CCTVCameraListItem {
  id: string
  camera_name: string
  hls_url: string
  ip_address: string
  last_updated: string
  road_code: string
  /** Station / km marker, e.g. "7+900" */
  sta: string
  status: CCTVCameraStatus
  warranty: CCTVCameraWarranty
}

export interface APIResponseCCTVCameraList {
  res_data: CCTVCameraListItem[]
  meta_data: MetaData
}

// ── GET /cctv/departments/{id}/cameras/totals ─────────────────────────────────

export interface APIRequestCCTVCameraTotals {
  solution_id?: number | string
  road_code?: string
}

export interface APIResponseCCTVCameraTotals {
  camera: CctvCameraCount
}

// ── GET /cctv/departments/{id}/cameras/dropdowns ──────────────────────────────

export interface APIRequestCCTVCameraDropdowns {
  solution_id?: number | string
  road_code?: string
}

export interface APIResponseCCTVCameraDropdowns {
  road_code: string[]
  status_name: string[]
  warranty_name: string[]
}

// ── GET /cctv/departments/{id}/cameras/random-online ──────────────────────────
// Random online cameras (fills with offline if not enough) — left-rail preview.

export interface CCTVRandomOnlineCamera {
  id: string
  camera_name: string
  road_code: string
  hls_url: string
  is_online: boolean
}

/** Note: the live API wraps the cameras in `{ count, data, limit }` — it does
 *  NOT return a bare array (the OpenAPI spec is inaccurate here). */
export interface APIResponseCCTVRandomOnline {
  count: number
  data: CCTVRandomOnlineCamera[]
  limit: number
}

// ── GET /cctv/departments/{id}/cameras/uptime-statistics ──────────────────────

export interface APIRequestCCTVUptime {
  percentage?: number
}

export interface APIResponseCCTVUptimeStatistics {
  camera: CctvCameraCount
  is_maintain: boolean
  percentage: number
}

// ── GET /cctv/cameras/central/list?road_id={roadId} ───────────────────────────
// Cameras for ONE road, grouped by (project / solution_location / solution).
// Only cameras whose solution has solution_type_id = 1 (CCTV) are returned.
// Powers the CCTV search page (search by road → see all its cameras).

/** Solution reference attached to a camera — present only when the camera also
 *  participates in that solution type; otherwise the field is null. */
export interface CCTVSolutionDetails {
  solution_id: number
  solution_name: string
}

export interface CCTVCameraResponse {
  id: string
  camera_name: string
  hls_url: string
  ip_address: string
  /** Station / km marker, e.g. "0+050" */
  sta: string
  /** Aggregate — currently equal to `stream_status`. */
  is_online: boolean
  /** Device is ICMP-pingable. Optional — older builds only ship the
   *  aggregate. May be false while `stream_status` is true (device on a
   *  different NAT/subnet but its HLS still serves). */
  ping_status?: boolean
  /** HLS/curl probe succeeds. Optional — older builds only ship the
   *  aggregate `is_online`. */
  stream_status?: boolean
  geometry_point: [number, number] | null
  curl_updated_at: string | null
  ping_updated_at?: string | null
  remark: string | null
  // Per-camera solution participation. Non-null → show the function tag.
  counting: CCTVSolutionDetails | null
  analytic: CCTVSolutionDetails | null
  traffic: CCTVSolutionDetails | null
  crosswalk: CCTVSolutionDetails | null
  wim_camera: CCTVSolutionDetails | null
  vms: CCTVSolutionDetails | null
}

export interface CCTVCameraCentralProject {
  project_id: number
  project_name: string
  is_warranty: boolean
  warranty_start: string | null
  warranty_end: string | null
}

export interface CCTVCameraCentralListItem {
  project: CCTVCameraCentralProject
  solution_id: number
  solution_location_id: number
  solution_location_name: string
  solution_name: string
  cameras: CCTVCameraResponse[]
}

export interface CCTVCameraCentralMetadata {
  camera_online_count: number
  camera_offline_count: number
  in_warranty_count: number
  out_warranty_count: number
  project_count: number
}

export interface APIResponseCCTVCameraCentralList {
  lists: CCTVCameraCentralListItem[]
  metadata: CCTVCameraCentralMetadata
}
