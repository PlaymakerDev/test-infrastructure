import { PromiseProperties } from './shared'

export type ConnectionStatus = 'online' | 'offline'
export type WarrantyStatus = 'in-warranty' | 'expired'

// API Response Types
export interface CctvCameraEntry {
  id: string
  roadCode: string
  projectName: string
  installPoint: string
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  bureau: string
  coord: [number, number]
  totalCameras: number
  onlineCount: number
  offlineCount: number
  ip: string
}

export interface CctvStats {
  total: number
  totalActive: number
  inWarranty: number
  inWarrantyActive: number
  expired: number
  expiredActive: number
}

export interface CctvLocation {
  road: {
    id: number
    code_name: string
  }
  solution: {
    id: number
    solution_name: string
  }
  total_cameras: number
  geometry_point: [number, number]
}

export interface CctvDeptOverview {
  centroid: [number, number]
  locations: CctvLocation[]
}

export interface CctvDeptOverviewListParams {
  deptId: string
  page?: number
  limit?: number
}

export interface CctvDeptOverviewListItem {
  road: {
    id: number
    code_name: string
  }
  solution: {
    id: number
    solution_name: string
  }
  camera: {
    total: number
    online: number
    offline: number
  }
  project: {
    id: number
    budget_year: number
    contract_no: string
  }
  department: {
    id: number
    name: string
  }
  is_warranty: boolean
}

export interface CctvDeptOverviewListResponse {
  res_data: CctvDeptOverviewListItem[]
  total: number
  page: number
  limit: number
}

export interface CctvDeptCamera {
  id: string
  camera_name: string
  hls_url: string
  geometry_point: [number, number]
}

export interface CctvDeptCamerasResponse {
  cctv: CctvDeptCamera[]
}

export interface CctvDeptOverviewTotals {
  camera: {
    total: number
    online: number
    offline: number
  }
  warranty: {
    active: number
    expired: number
  }
}

export interface CctvRandomOnlineCamera {
  id: string
  camera_name: string
  road_code: string
  hls_url: string
  is_online: boolean
}

export interface CctvRandomOnlineResponse {
  count: number
  data: CctvRandomOnlineCamera[]
}

// Redux State
export interface CctvState {
  list: CctvCameraEntry[]
  stats: CctvStats
  overview: CctvDeptOverview | null
  overviewList: CctvDeptOverviewListResponse | null
  totals: CctvDeptOverviewTotals | null
  detailCameras: CctvDeptCamerasResponse | null
  randomOnlineCameras: CctvRandomOnlineCamera[]
  task_schedules: {
    list: PromiseProperties
    stats: PromiseProperties
    overview: PromiseProperties
    overviewList: PromiseProperties
    totals: PromiseProperties
    detailCameras: PromiseProperties
    randomOnlineCameras: PromiseProperties
  }
}
