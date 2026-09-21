import { APIResponsePost } from "../shared"

// PROJECT BY ID
export interface APIResponseProjectByID {
  id: number
  project_name: string
  contract_no: string
  project_no: string
  contractor_id: string
  department_id: number
  warranty_start_date: string
  warranty_end_date: string
  created_at: string
  created_by: string
  budget_year: number
  legacy_pj_id: number
  updated_by: string
  updated_at: string
  is_warranty: boolean
  contractor: ProjectContractor
  department: ProjectDepartment
  project_roads: ProjectRoad[]
}

export interface ProjectContractor {
  id: string
  username: string
  user_type_id: number
  is_active: boolean
  created_at: string
  created_by: string
  deleted_by: any
}

export interface ProjectDepartment {
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
  region_id: any
}

export interface ProjectRoad {
  project_road_id: number
  project_id: number
  road_id: number
  road: Road
}

export interface Road {
  id: number
  road_name: string
  road_code: string
  subdistrict: string
  district: string
  province: string
  department_id: number
  start_sta: string
  end_sta: string
  distance: number
  created_at: string
  created_by: string
}

// PROJECT ROAD
export interface APIRequestRoadSolution {
  project_id: string | number
}

export type APIResponseRoadSolution = RoadSolutionList[]

export interface RoadSolutionList {
  project_road_id: number
  project_id: number
  road_id: number
  solution_locations: SolutionLocation[]
  road: Road
}

export interface SolutionLocation {
  solution_location_id: number
  project_id: number
  location_name: string
  created_at: string
  created_by: string
}

// SOLUTION
export interface APIRequestSolution {
  solution_location_id: number
}

export type APIResponseSolution = SolutionList[]

export interface SolutionList {
  id: number
  solution_location_id: number
  solution_type_id: number
  wid: number
  sta: any
  solution_name: string
  ip_address: string
  zt_ip_address: string
  geometry_point: number[]
  remarks: string
  anydesk: string
  created_at: string
  created_by: string
  updated_by: any
  updated_at: string
  solution_type: SolutionType
}

export interface SolutionType {
  id: number
  solution_name: string
  solution_name_atlas: string
}

// CAMERA CROSSING CODE
export interface APIResponseCameraCrossingCode {
  solution_id: number
  master_index_code: any
  camera_crossing_index_code: CameraCrossingIndexCode[]
}

export interface CameraCrossingIndexCode {
  camera_id: string
  camera_name: string
  crossing_index_code: string
}

// POST ROAD SOLUTION
export interface APIRequestCreateRoadSolution {
  location_name: string
  project_road_id: number
}

export type APIResponseCreateRoadSolution = APIResponsePost

// PUT SOLUTION LOCATION
export interface APIRequestUpdateSolutionLocation {
  location_name: string
}

export type APIResponseUpdateSolutionLocation = APIResponsePost

// DELETE SOLUTION LOCATION
export type APIResponseDeleteSolutionLocation = APIResponsePost

// POST SOLUTION
export interface APIRequestCreateSolution {
  anydesk_id: string
  geometry_point: GeometryPoint
  ip_address: string
  remarks: string
  solution_location_id: number
  solution_name: string
  solution_type_id: number
  sta: string
  zt_ip_address: string
}

export interface GeometryPoint {
  coordinates: number[]
  type: string
}

// GET SOLUTION DETAIL
export interface APIResponseSolutionByID {
  anydesk: string
  created_at: string
  // geometry_point: GeometryPoint
  geometry_point: number[]
  id: number
  ip_address: string
  remarks: string
  solution_location_id: number
  solution_name: string
  solution_type_id: number
  sta: string
  zt_ip_address: string
}

// UPDATE SOLUTION
export interface APIRequestUpdateSolution {
  anydesk_id: string
  geometry_point: GeometryPoint
  ip_address: string
  remarks: string
  solution_name: string
  sta: string
  zt_ip_address: string
}

export type APIResponseUpdateSolution = APIResponsePost

// DELETE SOLUTION
export type APIResponseDeleteSolution = APIResponsePost

// GET SOLUTION CAMERA LIST
export type APIResponseSolutionCameraList = SolutionCameraList[]

export interface SolutionCameraList {
  id: string
  ip_address: string
  department_id: number
  road_id: number
  solution_id: number
  camera_name: string
  sta: string
  hls_url: string
  point_geometry: number[]
  remark: any
  serial_number: any
  model: any
  brand: any
  created_by: string
  created_at: string
  ping_updated: string
  ping_status: boolean
  curl_updated: any
  curl_status: boolean
  contractor_id: string
  updated_at: string
}

// GET ROAD-LEVEL CCTV (/manage/solution/camera/by_project_road/{id})
//
// CCTV is one solution per (โครงการ + สายทาง), not per install point, so the
// settings page shows it once above the จุดติดตั้ง tabs. Each camera carries
// the point it actually stands at — that is a column in the table, and the
// value the add/edit form picks.

export interface ProjectRoadCCTVSolution {
  solution_id: number
  solution_name: string
  /** The chainage span its cameras cover, e.g. "0+100 - 6+000". */
  sta: string | null
}

export interface ProjectRoadCamera {
  id: string
  camera_name: string
  sta: string
  ip_address: string
  hls_url: string
  remark: string | null
  point_geometry: number[] | null
  curl_status: boolean
  curl_updated: string | null
  solution_id: number | null
  solution_location_id: number
  location_name: string
}

export interface APIResponseProjectRoadCameras {
  /** null when the road has no CCTV yet — the first camera creates it. */
  solution: ProjectRoadCCTVSolution | null
  cameras: ProjectRoadCamera[]
}
