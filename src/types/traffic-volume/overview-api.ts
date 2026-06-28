// Traffic Volume — Overview page API types
// Verified against: GET /counting/departments/{deptId}/overview/central/list

// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface CountingRoad {
  id: number
  code_name: string
}

export interface CountingProject {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

export interface CountingSolution {
  id: number
  solution_name: string
}

/** Per-solution camera summary. `total` is the camera count, `is_online`
 *  is the rolled-up health, and `count` is the live vehicle count
 *  (ปริมาณจราจร) reported by the cameras. Online/offline camera counts
 *  live on the solution root (`online_count` / `offline_count`). */
export interface CountingCamera {
  total: number
  is_online: boolean
  count: number
}

// ── GET /counting/departments/{deptId}/overview ──────────────────────────────
// Map markers + map centroid for the overall page. Optionally narrows to a
// single solution via `solution_id`.

export interface APIRequestTrafficVolumeOverview {
  solution_id?: string | number
}

export interface CountingLocation {
  solution: CountingSolution
  road: CountingRoad
  /** Cumulative vehicle count (คัน) reported for this location. */
  total_count: number
  /** [lng, lat] — map marker position. */
  geometry_point: [number, number]
}

export interface APIResponseTrafficVolumeOverview {
  locations: CountingLocation[]
  /** [lng, lat] — used to fly the map to the data centroid on first load. */
  centroid: [number, number] | null
}

// ── GET /counting/departments/{deptId}/overview/central/list ─────────────────
// Nested bureau → sub-departments → solutions tree, preferred for the
// overall page table.

export interface APIRequestTrafficVolumeCentralList {
  page?: number
  limit?: number
}

export interface CountingCentralSolution {
  road: CountingRoad
  project: CountingProject
  solution: CountingSolution
  camera: CountingCamera
  is_warranty: boolean
  /** Number of online cameras for this solution. */
  online_count: number
  /** Number of offline cameras for this solution. */
  offline_count: number
}

export interface CountingCentralSubDept {
  department_id: number
  department_short_name: string
  solutions: CountingCentralSolution[]
}

export interface CountingCentralItem {
  department_id: number
  department_short_name: string
  sub_department: CountingCentralSubDept[]
}

export type APIResponseTrafficVolumeCentralList = CountingCentralItem[]

// ── GET /counting/departments/{deptId}/cameras/random-online ─────────────────
// Random online cameras for the left-rail CCTV preview list.

export interface APIRequestTrafficVolumeRandomCameras {
  limit?: number
}

export interface CountingRandomCamera {
  solution_id: number
  camera: {
    id: string
    name: string
    ip_address: string
    hls_url: string
    /** Live vehicle count reported by this camera. */
    count: number
    is_online: boolean
  }
  road: CountingRoad
}

export interface APIResponseTrafficVolumeRandomCameras {
  count: number
  data: CountingRandomCamera[]
}

// ── GET /counting/departments/{deptId}/overview/totals ───────────────────────
// Aggregated counters for the right-rail stat cards.

export interface APIResponseTrafficVolumeTotals {
  camera: {
    total: number
    online: number
    offline: number
  }
  warranty: {
    active: number
    expired: number
  }
}
