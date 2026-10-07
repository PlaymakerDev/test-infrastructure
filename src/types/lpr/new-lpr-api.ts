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
  plates: LPRPlates
}

export interface LPRPlates {
  today: number
  yesterday: number
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

// DAILY COUNT
export interface APIRequestLPRDailyCount {
  date?: string
}

export interface APIResponseLPRDailyCount {
  solution_id: number
  date: string
  total: number
  cameras: CountCamera[]
}

export interface CountCamera {
  camera_id: string
  camera_name: string
  crossing_index: string
  count: number
}

// LPR PLATE STATS
export interface APIResponseLPRStat {
  total: number
  total_yesterday: number
  avg_speed: number
  hourly_today: HourlyToday[]
  hourly_yesterday: HourlyYesterday[]
  province_top: ProvinceTop[]
  vehicle_type_top: VehicleTypeTop[]
  top_province: TopProvince
  peak_hour: PeakHour
}

export interface HourlyToday {
  hour: number
  count: number
}

export interface HourlyYesterday {
  hour: number
  count: number
}

export interface ProvinceTop {
  province: string
  count: number
}

export interface VehicleTypeTop {
  vehicle_type_name: string
  count: number
}

export interface TopProvince {
  province: string
  count: number
}

export interface PeakHour {
  hour: number
  count: number
}

// LPR PLATES
export interface APIRequestLPRPlate {
  cursor?: string
  limit?: number
  from?: string
  to?: string
  q?: string
  source?: 'anpr' | 'wim' | string
}

export interface APIResponseLPRPlate {
  res_data: LPRPlateData[]
  next_cursor: string
  has_more: boolean
}

export interface LPRPlateData {
  id: number
  source: string
  captured_at: string
  captured_at_display: string
  plate_number: string
  plate_province: string
  vehicle_type_name: string
  vehicle_brand: string
  vehicle_color: string
  camera_name: string
  camera_ip: string
  detection_point: string
  vehicle_image: string
  plate_image: string
  speed: number
  confidence: number
}

// LPR PLATE LIST
export interface APIRequestLPRPlateList {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: string
  start_date?: string
  end_date?: string
}

export interface APIResponseLPRPlateList {
  res_data: LPRPlateData[]
  meta_data: MetaData
}

export interface LPRPlateData {
  id: number
  source: string
  captured_at: string
  captured_at_display: string
  plate_number: string
  plate_province: string
  vehicle_type_name: string
  vehicle_brand: string
  vehicle_color: string
  camera_name: string
  camera_ip: string
  detection_point: string
  vehicle_image: string
  plate_image: string
  speed: number
  confidence: number
}

export interface MetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}

// HOURLY COUNT
export type APIRequestLPRHourlyCount = APIRequestLPRDailyCount

export interface APIResponseLPRHourlyCount {
  solution_id: number
  date: string
  total: number
  hourly: Hourly[]
}

export interface Hourly {
  hour: number
  count: number
}

// SOLUTION CAMERA
export interface APIResponseSolutionCamera {
  solution_id: number
  cameras: SolutionCamera[]
}

export interface SolutionCamera {
  camera_id: string
  camera_name: string
  ip_address: string
  hls_url: string
  sta: string
  lat: number
  lng: number
  is_online: boolean
  crossing_index: string
}