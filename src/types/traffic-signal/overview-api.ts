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

// ── 7. GET /traffic/departments/{deptId}/cameras/dropdowns ────────────────────

export interface APIRequestTrafficCameraDropdowns {
  road_code?: string
}

export interface APIResponseTrafficCameraDropdowns {
  road_code: string[]
  solution_name: string[]
  camera_type: string[]
}
