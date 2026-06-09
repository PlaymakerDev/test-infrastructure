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

// Redux State
export interface CctvState {
  list: CctvCameraEntry[]
  stats: CctvStats
  overview: CctvDeptOverview | null
  task_schedules: {
    list: PromiseProperties
    stats: PromiseProperties
    overview: PromiseProperties
  }
}
