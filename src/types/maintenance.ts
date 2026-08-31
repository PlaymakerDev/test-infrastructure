// Maintenance API Types - from OpenAPI spec

// --- Request Types ---
export interface CreateCaseRequest {
  camera_id: string
  category?: string
  problem?: string
  responsible?: string
  before_image?: string[]
}

export interface UpdateCaseRequest {
  category?: string
  problem?: string
  responsible?: string
  before_image?: string[]
  after_image?: string[]
  inspection_date?: string | null
  solution_method?: string
  is_closed?: boolean
}

export interface MaintenanceCaseParams {
  status?: 'closed' | 'open' | 'inspected'
  date_from?: string
  date_to?: string
}

export interface MaintenanceHistoryParams {
  status?: 'all' | 'open' | 'in_progress' | 'closed'
  region_id?: number
  department_id?: number
  road_code?: string
  warranty?: 'in' | 'out'
  category?: string
  search?: string
  date_from?: string
  date_to?: string
}

// --- Response Types ---

// Hierarchical detail response (GET /maintenance/detail/{solution_type_id})
export interface SolutionLocationSolution {
  solution_id: number
  solution_name: string
  online_count: number
  offline_count: number
}

export interface SolutionLocation {
  solution_location_id: number
  solution_location_name: string
  online_count: number
  offline_count: number
  solution: SolutionLocationSolution[]
}

export interface DetailProject {
  project_id: number
  project_name: string
  online_count: number
  offline_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  solution_location: SolutionLocation[]
}

export interface DetailRoad {
  road_id: number
  road_name: string
  road_code: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  projects: DetailProject[]
}

export interface DetailDepartment {
  department_id: number
  department_name: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  roads: DetailRoad[]
}

export interface DetailBureau {
  bureau_id: number
  bureau_name: string
  online_count: number
  offline_count: number
  projects_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  device_count: number
  departments: DetailDepartment[]
}

// Flat response types
export interface SummaryItem {
  solution_type_id: number
  type: string
  device_count: number
  location_count: number
}

/** GET /{prefix}/departments/{id}/{cameras|overview}/uptime-statistics?scope=all
 *  — per-domain online percentage used by Solution Overview's rings. The
 *  response also carries a domain-specific `{ total, online, offline }` block
 *  under a key named after the domain (e.g. `camera`, `traffic`, `lighting`),
 *  omitted here since only the aggregate percentage is needed. */
export interface UptimeStatistics {
  percentage: number
  is_maintain: boolean
}

export interface WarrantySummaryItem {
  in_warranty: boolean
  project_count: number
  device_count: number
  location_count: number
  online_count: number
  offline_count: number
  open_case_count: number
  in_progress_count: number
  closed_case_count: number
}

export interface OfflineRoadItem {
  road_id: number
  road_name: string
  location_count: number
  device_count: number
  offline_count: number
}

export interface CameraItem {
  camera_id: string
  camera_name: string
  camera_ip: string
  status: boolean
  case_no?: string | null
  curl_updated_at?: string | null
  category?: string | null
  brand?: string | null
  model?: string | null
  hostname?: string | null
  anydesk?: string | null
  zerotier?: string | null
  username?: string | null
  password?: string | null
}

export interface SolutionDetailResponse {
  solution_id: number
  solution_name: string
  warranty_status: boolean
  online_count: number
  offline_count: number
  lists: CameraItem[]
}

export interface CaseDetail {
  id: string
  camera_id: string
  case_no: string
  category: string
  responsible: string
  problem: string
  solution_method: string
  inspection_date: string | null
  before_image: string | null
  after_image: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface CaseHistoryItem {
  case_no: string
  camera_name: string
  camera_ip: string
  problem: string
  responsible: string
  reported_at?: string | null
  inspection_date?: string | null
  closed_at?: string | null
}

export interface HistoryCase {
  case_no: string
  /** Present on newer history responses. When absent, callers may only infer
   *  a solution from an unambiguous camera/type relationship. */
  solution_id?: number | null
  category: string
  department_name: string
  device_name: string
  location_name: string
  road_name: string
  status: 'open' | 'in_progress' | 'closed'
  reported_at: string
  /** Last successful health check. The endpoint ships this but leaves
   *  `offline_days` at 0, so the UI derives the day count from here. */
  curl_updated_at?: string | null
  offline_days: number
  solution_type: string
  warranty_status: boolean
}

export interface HistoryRegion {
  region_id?: number | null
  region_name: string
  cases: HistoryCase[]
}

export interface RegionItem {
  id: number
  name_th: string
  name_en: string
}

// One row of the "สรุปผู้รับจ้าง" page — matches
// GET /manage/maintenance/contractor-summary from the backend.
// email/phone are '' (never null) so the FE can always render them.
export interface ContractorSummaryRow {
  user_id: string
  short_name: string
  company_name: string
  email: string
  phone: string
  projects: number
  roads: number

  cctv_total: number
  cctv_offline: number
  traffic_total: number
  traffic_offline: number
  vms_total: number
  vms_offline: number
  lighting_total: number
  lighting_offline: number
  bridge_lighting_total: number
  bridge_lighting_offline: number
  wim_total: number
  wim_offline: number

  total_offline: number
  open_cases: number
}

// ── GET /manage/maintenance/central/{solution_type_id} ───────────────────────
// สทช. → ขทช. tree with device- AND location-level online/offline counts.
// Added by BE 2026-08-26 for the จุดติดตั้งอุปกรณ์ tab's sidebar (per-type:
// 1=CCTV, 6=Lighting, 7=VMS). `bureau_id` is a DB id, NOT the สทช. running
// number (e.g. สทช.2 has bureau_id 7) — treat as opaque; the response is
// already ordered for display and `bureau_name` carries the full label.

export interface MaintenanceCentralDepartment {
  department_id: number
  department_name: string
  online_count: number
  offline_count: number
  device_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
}

export interface MaintenanceCentralBureau {
  bureau_id: number
  bureau_name: string
  online_count: number
  offline_count: number
  device_count: number
  location_count: number
  location_online_count: number
  location_offline_count: number
  departments: MaintenanceCentralDepartment[]
}

// ── GET /manage/maintenance/device-road/{department_id}?solution_type_id= ────
// Every device of one solution type on the department's roads, grouped by
// road (BE 2026-08-27) — the จุดติดตั้งอุปกรณ์ tab's table source. Only
// 1=CCTV, 6=Lighting, 7=VMS are supported.

export interface MaintenanceRoadDevice {
  name: string
  /** Km marker, e.g. "21+871" (bare — no "กม." prefix). May be null. */
  sta: string | null
  latitude: number
  longitude: number
  /** Thai device-category label (BE added 2026-08-31). Lighting sends
   *  'โคมไฟ' | 'ตู้โจรกรรม'; CCTV/VMS send an empty string (verified live
   *  across 25 departments — 7,798 CCTV + 151 VMS devices all ''). */
  device_type?: string | null
}

export interface MaintenanceDeviceRoad {
  road_id: number
  road_code: string
  road_name: string
  /** จุดติดตั้ง count on this road. */
  solution_count: number
  /** Device (camera/sign/cabinet) count on this road. */
  device_count: number
  device: MaintenanceRoadDevice[]
}
