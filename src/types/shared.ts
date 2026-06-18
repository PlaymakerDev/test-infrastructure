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
export interface APIResponseContactDetail {
  id: number
  project_name: string
  contract_no: string
  department_name: string
  warranty_start_date: string
  warranty_end_date: string
  company_name: string
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