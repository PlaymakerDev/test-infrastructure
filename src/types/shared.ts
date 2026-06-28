export interface APIActionResponse {
  message: string;
}

export interface PromiseProperties {
  loading: boolean;
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'FAILED'
}

export interface MetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface SharedSolution {
  id: number
  solution_name: string
}

export interface SharedRoad {
  id: number
  code_name: string
}

export interface SharedVMS {
  anydesk: string
  last_connected: string
  desktop_screen: string
  hls_url: string
  status: SharedStatus
  camera: SharedCamera | null
}

export interface SharedStatus {
  is_online: boolean
  name: string
}

export interface SharedProject {
  id: number
  name?: string
  project_name?: string
  budget_year: number
  contract_no: string
}

export interface SharedWarranty {
  is_warranty: boolean
  name: string
}

export interface SharedCamera {
  id: string
  camera_name: string
  ip_address: string
  hls_url: string
}

// API RESPONSE
// Backend returns the status as a Thai label that doubles as the badge text.
export type WarrantyStatusString =
  | 'ในค้ำ'
  | 'หมดค้ำ'
  | 'ก่อนค้ำ'
  // Fall-through for any future status the backend introduces.
  | (string & {})

export interface APIResponseContactDetail {
  id: number
  project_name: string
  contract_no: string
  department_name: string
  warranty_start_date: string
  warranty_end_date: string
  /** Remaining days as computed by the backend. 0 when expired or
   *  before warranty starts. Use this instead of parsing dates on the FE. */
  warranty_date: number
  /** Status enum from backend — drives badge color + label. */
  warranty_status: WarrantyStatusString
  company_name: string
}

// ── GET /manage/roads ─────────────────────────────────────────────────────────
// Paginated road list — used by the CCTV search autocomplete (pick a road →
// fetch its cameras).

export interface Road {
  id: number
  road_code: string
  road_name: string
  department_id: number
  distance: number
  district: string
  province: string
  start_sta: string
  end_sta: string
  subdistrict: string
}

export interface APIRequestRoadList {
  department_id?: number
  search?: string
  page?: number
  limit?: number
  field?: string
  sort?: string
}

export interface APIResponseRoadList {
  res_data: Road[]
  meta_data: MetaData
}

export interface APIRequestDepartmentByRoad {
  road_id?: number
}

export interface APIResponseDepartmentByRoad {
  id: number
  department_group: number
  province: string
  department_office_no: number
  department_name: string
  department_short_name: string
  is_external: number
  province_id: number
  line_token: string
  line_group_token: string
  is_urban: number
  department_type: number
  region_id: number
}

// UPLOAD
export interface UploadResponse {
  path: string;
}

// API POST RESPONSE
export interface APIResponsePost {
  res_code: number
  res_data: string
}

export interface WIMMetaData {
  has_next_page: boolean
  has_previous_page: boolean
  page: number
  page_count: number
  page_size: number
  total: number
}