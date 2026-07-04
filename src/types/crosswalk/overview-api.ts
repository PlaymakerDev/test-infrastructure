// Crosswalk — Overview page API types
// Verified against: GET /crosswalk/departments/{deptId}/overview/central/list

// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface CrosswalkRoad {
  id: number
  code_name: string
}

export interface CrosswalkProjectInfo {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

export interface CrosswalkSolution {
  id: number
  solution_name: string
}

/** Per-solution camera summary. Online/offline counts live inside `camera`
 *  for the crosswalk endpoint (unlike traffic-volume where they hang off the
 *  solution root). */
export interface CrosswalkCamera {
  total: number
  online_count: number
  offline_count: number
}

/** Crosswalk device summary — the actual ทางข้าม unit health/count. */
export interface CrosswalkDevice {
  total: number
  is_online: boolean
}

// ── GET /crosswalk/departments/{deptId}/overview ─────────────────────────────
// Map markers + centroid for the overall page map. Optionally narrows to a
// single solution via `solution_id`.

export interface APIRequestCrosswalkOverview {
  solution_id?: string | number
}

export interface CrosswalkLocation {
  solution: CrosswalkSolution
  road: CrosswalkRoad
  camera: CrosswalkCamera
  crosswalk: CrosswalkDevice
  /** [lng, lat] — map marker position. Backend returns this in PascalCase. */
  GeometryPoint: [number, number]
}

export interface APIResponseCrosswalkOverview {
  locations: CrosswalkLocation[]
  /** [lng, lat] — used to fly the map to the data centroid on first load.
   *  Not always returned by the endpoint. */
  centroid?: [number, number] | null
}

// ── GET /crosswalk/departments/{deptId}/overview/central/totals ──────────────
// Aggregated counters for the right-rail stat cards. `solution` counts the
// ทางข้าม จุดติดตั้ง fleet (total/online/offline); `warranty` counts projects
// by warranty status (active = ในค้ำ, expired = หมดค้ำ).

export interface APIResponseCrosswalkTotals {
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

// ── GET /crosswalk/departments/{deptId}/cameras/random-online ────────────────
// Random online cameras for the left-rail CCTV preview list.

export interface APIRequestCrosswalkRandomCameras {
  limit?: number
}

export interface CrosswalkRandomCamera {
  camera: {
    id: string
    name: string
    hls_url: string
    is_online: boolean
  }
  road: CrosswalkRoad
}

export interface APIResponseCrosswalkRandomCameras {
  count: number
  data: CrosswalkRandomCamera[]
}

// ── GET /crosswalk/departments/{deptId}/overview/central/list ────────────────
// Nested bureau → sub-departments → solutions tree, preferred for the
// overall page table. `solution_id` narrows to a single solution row.

export interface APIRequestCrosswalkCentralList {
  page?: number
  limit?: number
  solution_id?: string | number
}

export interface CrosswalkCentralSolution {
  road: CrosswalkRoad
  project: CrosswalkProjectInfo
  solution: CrosswalkSolution
  camera: CrosswalkCamera
  crosswalk: CrosswalkDevice
  is_warranty: boolean
}

export interface CrosswalkCentralSubDept {
  department_id: number
  department_short_name: string
  solutions: CrosswalkCentralSolution[]
}

export interface CrosswalkCentralItem {
  department_id: number
  department_short_name: string
  sub_department: CrosswalkCentralSubDept[]
}

export type APIResponseCrosswalkCentralList = CrosswalkCentralItem[]
