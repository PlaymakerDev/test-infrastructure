export type TaskKind = 'CCTV' | 'Traffic Volume' | 'Incident Detection'

export interface Equipment {
  id: string
  name: string
  km: string
  ipAddress?: string
  hlsUrl?: string
  latitude: string
  longitude: string
  note?: string
  isOnline: boolean
  streamConnected: boolean
  lastUpdated: string
  crossingCode?: string
}

export interface TaskType {
  id: string
  kind: TaskKind
  pointName: string
  latitude: string
  longitude: string
  km: string
  localIp?: string
  anyDesk?: string
  ztIp?: string
  note?: string
  // For CCTV: owned equipment list.
  // For Traffic Volume / Incident Detection: references (equipment.id) to CCTVs
  // that this task-type also operates on (same physical camera, extra analytic).
  equipment: Equipment[]
  equipmentRefs?: string[]
}

export interface InstallPoint {
  id: string
  name: string
  taskTypes: TaskType[]
}

export interface RouteDetail {
  id: string
  code: string
  points: InstallPoint[]
}

export interface ProjectDetail {
  id: string
  code: string
  name: string
  warrantyStatus: 'in-warranty' | 'expired' | 'delivering'
  routes: RouteDetail[]
}
