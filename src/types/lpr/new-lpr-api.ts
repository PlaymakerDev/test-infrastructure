// OVERVIEW
export interface APIRequestLPROverview {
  scope?: string
  road_id?: number
  solution_id?: number
}

export interface APIResponseLPROverview {
  locations: Location[]
  centroid: number[]
}

export interface Location {
  solution: LPRSolution
  road: LPRRoad
  lpr: LPR
  is_online: boolean
  geometry_point: number[]
}

export interface LPRSolution {
  id: number
  solution_name: string
}

export interface LPRRoad {
  id: number
  code_name: string
}

export interface LPR {
  total_camera: number
  total_online: number
  total_offline: number
}

// LIST
export interface APIRequestLPRList {
  scope?: string
  road_id?: number
  road_code?: string
}

export type APIResponseLPRList = ListData[]

export interface ListData {
  department_id: number
  department_short_name: string
  sub_department: SubDepartment[]
}

export interface SubDepartment {
  department_id: number
  department_short_name: string
  solutions: SubDptSolution[]
}

export interface SubDptSolution {
  road: LPRRoad
  project: Project
  solution: LPRSolution
  lpr: LPR
  is_online: boolean
  is_warranty: boolean
}

export interface Project {
  id: number
  project_name: string
  budget_year: number
  contract_no: string
}

// OVERVIEW TOTAL
export type APIRequestLPRTotal = APIRequestLPRList

export interface APIResponseLPRTotal {
  solution: LPRTotalSolution
  warranty: LPRTotalWarranty
}

export interface LPRTotalSolution {
  total: number
  online: number
  offline: number
}

export interface LPRTotalWarranty {
  active: number
  expired: number
}

// RANDOM ONLINE
export interface APIRequestLPRRandomOnline {
  scope?: string
  road_id?: number
  solution_id?: number
  limit?: number
}

export interface APIResponseLPRRandomOnline {
  count: number
  data: RandomOnlineData[]
  limit: number
}

export interface RandomOnlineData {
  camera: RandomOnlineCamera
  road: LPRRoad
  solution: LPRSolution
}

export interface RandomOnlineCamera {
  id: string
  name: string
  hls_url: string
  ip_address: string
  is_online: boolean
}