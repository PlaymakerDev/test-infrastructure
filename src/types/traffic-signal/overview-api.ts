// Traffic Signal — Overview page API types
// Source: drr-cm-fe/types/traffic/api.ts (verified against backend usage)

import type { MetaData } from '../shared'

// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface TrafficRoad {
  id: number
  code_name: string
}

export interface TrafficSolution {
  id: number
  solution_name: string
}

export interface TrafficProject {
  id: number
  budget_year: number
  contract_no: string
}

// ── 1. GET /traffic/departments/{deptId}/overview ─────────────────────────────
// Map markers + centroid for default map center. Optionally filter to a
// single solution via `solution_id` — backend narrows the locations array
// to that one signal (useful for "deep-link to this signal" menu items).

export interface APIRequestTrafficOverview {
  solution_id?: string | number
}

export interface APIResponseTrafficOverview {
  locations: TrafficLocation[]
  centroid: [number, number] | null
}

export interface TrafficLocation {
  road: TrafficRoad
  solution: TrafficSolution
  traffic: {
    total_pcu: number
    total_phases: number
    is_online: boolean
  }
  GeometryPoint: [number, number]
}

// ── 2. GET /traffic/departments/{deptId}/overview/totals ──────────────────────
// Stats cards: solution online/offline + warranty active/expired.

export interface APIResponseTrafficTotals {
  solution: {
    total: number
    online: number
    offline: number
  }
  warranty: {
    active: number
    expired: number
  }
}

// ── 3. GET /traffic/departments/{deptId}/overview/list ────────────────────────

export interface APIRequestTrafficList {
  page?: number
  limit?: number
  road_code?: string
  contract_no?: string
}

export interface TrafficOverviewListItem {
  road: TrafficRoad
  project: TrafficProject
  solution: TrafficSolution
  traffic: {
    controller_mode: string
    total_pcu: number
    total_phases: number
    is_online: boolean
  }
  is_warranty: boolean
}

// ── 3b. GET /traffic/departments/{deptId}/overview/central/list ───────────────
// Nested bureau → sub-departments → solutions tree. Returns a richer per-row
// payload than the flat `/list` endpoint (adds `project.project_name` and
// camera online/offline counts), which is why we prefer it for the overall
// page table.

export interface TrafficOverviewCentralProject extends TrafficProject {
  project_name: string
}

export interface TrafficOverviewCentralSolution {
  road: TrafficRoad
  project: TrafficOverviewCentralProject
  solution: TrafficSolution
  traffic: {
    controller_mode: string
    total_pcu: number
    total_phases: number
    is_online: boolean
  }
  is_warranty: boolean
  online_count: number
  offline_count: number
}

export interface TrafficOverviewCentralDept {
  department_id: number
  department_short_name: string
  solutions: TrafficOverviewCentralSolution[]
}

export interface TrafficOverviewCentralItem {
  department_id: number
  department_short_name: string
  sub_department: TrafficOverviewCentralDept[]
}

export type APIResponseTrafficCentralList = TrafficOverviewCentralItem[]

export interface APIResponseTrafficList {
  res_data: TrafficOverviewListItem[]
  meta_data: MetaData
}

// ── 4. GET /traffic/departments/{deptId}/overview/dropdowns ───────────────────

export interface APIRequestTrafficOverviewDropdowns {
  road_code?: string
  contract_no?: string
}

export interface APIResponseTrafficOverviewDropdowns {
  road_code: string[]
  contract_no: string[]
}

// ── 5. GET /traffic/departments/{deptId}/cameras/random-online ────────────────

export interface APIRequestTrafficRandomCameras {
  limit?: number
}

export interface TrafficRandomCamera {
  camera: {
    id: string
    name: string
    hls_url: string
    is_online: boolean
    /** Backend added these 2026-06-24 — power the side-rail preview pills. */
    ip_address: string
    phases_no: number
    camera_type: 'Counting' | 'StopLine' | null
  }
  road: TrafficRoad
}

export interface APIResponseTrafficRandomCameras {
  count: number
  data: TrafficRandomCamera[]
  limit: number
}

// ── 6. GET /traffic/departments/{deptId}/cameras/list ─────────────────────────

export interface APIRequestTrafficCameraList {
  page?: number
  limit?: number
  road_code?: string
  solution_name?: string
  camera_type?: string
  status_name?: string
  warranty_name?: string
}

export interface TrafficCameraEntry {
  id: string
  name: string
  phases_no: number
  type: string
  total_pcu: number
  is_online: boolean
  is_warranty: boolean
}

export interface TrafficCameraListGroup {
  road: TrafficRoad
  solution: TrafficSolution
  traffic_camera: TrafficCameraEntry[]
}

export interface APIResponseTrafficCameraList {
  res_data: TrafficCameraListGroup[]
  meta_data: MetaData
}

// ── 6b. GET /traffic/departments/{deptId}/cameras/central/list ────────────────
// Nested bureau → sub-dept → solutions[] (each with cameras + counts).
// Used as the data source for the detail-page title bar (road code, solution
// name, anydesk*) — `anydesk` field is documented as TODO by backend, will
// appear here once they add it.

export interface TrafficCameraCentralSolution {
  road: TrafficRoad
  solution: TrafficSolution & { traffic_id?: number }
  traffic_camera: TrafficCameraEntry[]
  online_count: number
  offline_count: number
  /** Optional — BE will populate this in a follow-up; we keep it undefined
   *  until then so the anydesk button stays hidden gracefully. */
  anydesk?: number | string | null
}

export interface TrafficCameraCentralDept {
  department_id: number
  department_short_name: string
  solutions: TrafficCameraCentralSolution[]
}

export interface TrafficCameraCentralItem {
  department_id: number
  department_short_name: string
  sub_department: TrafficCameraCentralDept[]
}

export type APIResponseTrafficCameraCentralList = TrafficCameraCentralItem[]

// ── 7. GET /traffic/departments/{deptId}/cameras/dropdowns ────────────────────

export interface APIRequestTrafficCameraDropdowns {
  road_code?: string
}

export interface APIResponseTrafficCameraDropdowns {
  road_code: string[]
  solution_name: string[]
  camera_type: string[]
}
