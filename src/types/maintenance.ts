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
  category: string
  department_name: string
  device_name: string
  location_name: string
  road_name: string
  status: 'open' | 'in_progress' | 'closed'
  reported_at: string
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
