// Tunnel — Overview page API types
// Live contract for /overview, /overview/central/list and /overview/central/totals.
// The /cameras/random-online shape below is still an educated placeholder —
// swap once verified against the real backend.

// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface TunnelRoad {
  id: number
  code_name: string
}

export interface TunnelProjectInfo {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

export interface TunnelSolution {
  id: number
  solution_name: string
}

// ── GET /tunnel/departments/{deptId}/overview ────────────────────────────────

export interface APIRequestTunnelOverview {
  solution_id?: string | number
}

export interface TunnelLocation {
  solution: TunnelSolution
  road: TunnelRoad
  /** Per-tunnel device summary — camera + lighting inventory and health.
   *  Shares the same shape as the row-level tunnel object in
   *  `TunnelCentralSolution` (declared below and re-referenced here). */
  tunnel: TunnelListDevice
  /** [lng, lat] — map marker position. Backend returns this in PascalCase. */
  GeometryPoint: [number, number]
  /** Login-tokenised URL that opens the tunnel's control dashboard. */
  tunnel_url?: string
}

export interface APIResponseTunnelOverview {
  locations: TunnelLocation[]
  /** [lng, lat] — used to fly the map to the data centroid on first load.
   *  Optional: backend only includes it in some deployments; the map falls
   *  back to `fitBounds` on the visible markers when absent. */
  centroid?: [number, number] | null
}

// ── GET /tunnel/departments/{deptId}/overview/central/totals ─────────────────

export interface APIResponseTunnelTotals {
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

// ── GET /tunnel/departments/{deptId}/cameras/random-online ───────────────────

export interface APIRequestTunnelRandomCameras {
  limit?: number
}

export interface TunnelRandomCamera {
  camera: {
    id: string
    name: string
    hls_url: string
    is_online: boolean
  }
  road: TunnelRoad
}

export interface APIResponseTunnelRandomCameras {
  count: number
  data: TunnelRandomCamera[]
}

// ── GET /tunnel/departments/{deptId}/overview/central/list ───────────────────
// Bureau-aware nested list — `bureau → sub_department → solutions`. The count
// badge on the table's bureau header rows is driven by the number of leaf
// solutions grouped under each bureau.

export interface APIRequestTunnelCentralList {
  page?: number
  limit?: number
  road_code?: string
  contract_no?: string
  search?: string
  field?: string
  sort?: 'ASC' | 'DESC'
}

/** Per-row tunnel device summary. Includes the tunnel's camera + lighting
 *  inventory counts and its online health flag. */
export interface TunnelListDevice {
  camera_count: number
  lighting_count: number
  is_online: boolean
}

export interface TunnelCentralSolution {
  road: TunnelRoad
  project: TunnelProjectInfo
  solution: TunnelSolution
  tunnel: TunnelListDevice
  is_warranty: boolean
  /** Login-tokenised URL that opens the tunnel's control dashboard. */
  tunnel_url?: string
}

export interface TunnelCentralSubDept {
  department_id: number
  department_short_name: string
  solutions: TunnelCentralSolution[]
}

export interface TunnelCentralItem {
  department_id: number
  department_short_name: string
  sub_department: TunnelCentralSubDept[]
}

export type APIResponseTunnelCentralList = TunnelCentralItem[]
