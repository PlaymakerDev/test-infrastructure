// Dashboard page — backend response types.
//
// The dashboard aggregates across systems, but the API itself is NOT a single
// `/dashboard` namespace — it composes from the feature-scoped endpoints
// (cctv/vms/lighting/analytic/counting/traffic + /manage/solution position).
// Mirrored from drr-cm-fe/types/dashboard/api.ts, narrowed to fields we render.

// ── Uptime: /{feature}/departments/{deptId}/.../uptime-statistics ─────────────
// Same shape across cctv / vms / lighting (key name differs by feature).

export interface DashboardUptimeBlock<K extends string> {
  /** Key is dynamic per feature: 'camera' (cctv), 'vms', 'lighting'. */
  [_K: string]: { total: number; online: number; offline: number } | number | boolean
  percentage: number
  is_maintain: boolean
}

// Concrete aliases — let the call site see which feature it's reading.
export type APIResponseDashboardCctvUptime = {
  camera: { total: number; online: number; offline: number }
  percentage: number
  is_maintain: boolean
}
export type APIResponseDashboardVmsUptime = {
  vms: { total: number; online: number; offline: number }
  percentage: number
  is_maintain: boolean
}
export type APIResponseDashboardLightingUptime = {
  lighting: { total: number; online: number; offline: number }
  percentage: number
  is_maintain: boolean
}

// ── /manage/solution/{deptId}/position — all-systems markers for the map ──────

export interface DashboardPositionLocation {
  road: {
    id: number
    road_code: string
    road_name: string
    /** BE 2026-06-24: dept that owns this road. Drives the Breadcrumb "ขทช." line. */
    department_id: number
    /** BE 2026-06-24: parent สทช. (0–21). Country-level summary marker aggregates by this. */
    stch: number
  }
  solution: {
    solution_id: number
    solution_name: string
    solution_type_id: number
    solution_type_name: string
  }
  geometry_point: [number, number] | null
}

export interface APIResponseDashboardPosition {
  locations: DashboardPositionLocation[]
  centroid: [number, number] | null
}

// ── /analytic/details/{deptId}/dashboard?type= — bucketed event counts ────────

export type DashboardBucketType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface DashboardBucket {
  label: string
  count: number
}
export type APIResponseDashboardAnalytic = DashboardBucket[]

// ── /traffic/{deptId}/dashboard?type=&limit= — top solutions by volume ────────

export interface DashboardTrafficRow {
  solution_name: string
  total_pcu: number
  total_vehicle: number
}
export interface APIResponseDashboardTraffic {
  data: DashboardTrafficRow[]
}

// ── /counting/{deptId}/dashboard — vehicle counts + hourly buckets ────────────

export interface DashboardCountingHour {
  hour_timestamp: string
  bike_count: number
  car_count: number
  truck_count: number
  bus_count: number
  taxi_count: number
  pickup_count: number
  trailer_count: number
  total_count: number
  bike_pcu: number
  car_pcu: number
  truck_pcu: number
  bus_pcu: number
  taxi_pcu: number
  pickup_pcu: number
  trailer_pcu: number
  total_pcu: number
}

/** One vehicle-type summary used by daily_vehicle_count.{key}. */
export interface DashboardCountingVehicleStat {
  count: number
  pcu_factor: number
  total_pcu: number
  percentage: number
}

/** Verified 2026-06-24: `daily_vehicle_count` is an OBJECT keyed by vehicle
 *  type — NOT a list. Includes a `total` aggregate alongside the 7 types. */
export interface DashboardCountingVehicleCount {
  bike: DashboardCountingVehicleStat
  car: DashboardCountingVehicleStat
  truck: DashboardCountingVehicleStat
  bus: DashboardCountingVehicleStat
  taxi: DashboardCountingVehicleStat
  pickup: DashboardCountingVehicleStat
  trailer: DashboardCountingVehicleStat
  total: DashboardCountingVehicleStat
}

export interface APIResponseDashboardCounting {
  daily_count_hour: DashboardCountingHour[]
  daily_vehicle_count: DashboardCountingVehicleCount
}
