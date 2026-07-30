// API BRIDGE LIGHTING LIST
export interface APIRequestBridgeLightingList {
  scope?: string
  road_id?: number | string
}

export type APIResponseBridgeLightingList = BridgeLightingListItem[]

export interface BridgeLightingListItem {
  department_id: number
  department_short_name: string
  sub_department: BridgeLightingSubDepartment[]
}

export interface BridgeLightingSubDepartment {
  department_id: number
  department_short_name: string
  solutions: BridgeLightingSolution[]
}

export interface BridgeLightingSolution {
  road: Road
  project: Project
  solution: Solution
  is_online: boolean
  last_update: string
  is_warranty: boolean
  geometry_point: number[]
}

export interface Project {
  budget_year: number
  contract_no: string
  id: number
  project_name: string
}

export interface Road {
  code_name: string
  id: number
}

export interface Solution {
  id: number
  solution_name: string
}

// API BRIDGE LIGHTING TOTAL
export type APIRequestBridgeLightingTotal = APIRequestBridgeLightingList

export interface APIResponseBridgeLightingTotal {
  solution: TotalSolution
  warranty: TotalWarranty
}

export interface TotalSolution {
  total: number
  online: number
  offline: number
}

export interface TotalWarranty {
  active: number
  expired: number
}

// API MAP
export interface APIRequestBridgeLightingOverview extends APIRequestBridgeLightingList {
  solution_id?: number
  road_code?: string
  contract_no?: string
  scope?: string
  road_id?: number | string
}

export interface APIResponseBridgeLightingOverview {
  locations: BridgeLightingLocation[]
  centroid: number[]
}

export interface BridgeLightingLocation {
  solution: Solution
  road: Road
  is_online: boolean
  last_update: string
  geometry_point: number[]
}

// API WID
export interface APIResponseBridgeLightingWID {
  solution_id: number
  wid: number
}

// API PM CHART
export interface APIRequestPostPmChart {
  wid: string
}

export type APIResponsePostPmChart = PmChartData[]

export interface PmChartData {
  bucket: string
  freq_avg: string
  i_avg: string
  i_l1: string
  i_l2: string
  i_l3: string
  kw_avg: string
  kw_max: string
  kwh: string
  meter_address: string
  pf_avg: string
  v_avg: string
  v_l1: string
  v_l2: string
  v_l3: string
  wid: number
}

// API SHELLY STATUS
export type APIRequestPostShellyStatus = APIRequestPostPmChart

export type APIResponsePostShellyStatus = {
  data: ShellyStatusData[]
  status: number
}

export interface ShellyStatusData {
  last_seen: string
  mac: string
  mqtt_prefix: string
  name: string
  online: boolean
  output: boolean
  wid: number
}

// API OPEN BRIDGE LIGHTING
// send="1" turns the light ON, send="2" turns it OFF (upstream
// its-api-go/dashvue/openBridgeLighting — NOT "0"). Prior "0" silently
// no-op'd against the legacy service, which is why users reported
// "เปิดได้ ปิดไม่ได้" before 2026-07-18.
export interface APIRequestPostOpenBridgeLighting {
  send: '1' | '2'
  wid: string
}

export interface APIResponsePostOpenBridgeLighting { }