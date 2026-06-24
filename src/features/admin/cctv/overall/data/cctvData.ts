// Shared CCTV view types. All list/map/table data now comes from the live
// `/cctv` API — this file keeps only the shapes the detail page builds from it.

export type WarrantyStatus = 'in-warranty' | 'expired'

// ── Install-point detail (built from the central/list API in the detail screen) ──

export interface CctvInstallPin {
  id: string
  coord: [number, number]
  online: boolean
}

export interface PanelCamera {
  id: string
  name: string
  ip: string
  online: boolean
  /** Station / km marker, e.g. "7+900" (from camera `sta`). */
  km?: string
  hlsUrl?: string
  functions?: string[]
  /** [lng, lat] — used to plot the camera on the detail map. */
  coord?: [number, number]
}

export interface CctvInstallDetail {
  id: string
  roadCode: string
  title: string
  location: string
  projectName: string
  contractNo: string
  warrantyStatus: WarrantyStatus
  /** project.id / road.id — feed the central Project Info modal (ⓘ in header). */
  projectId?: number
  roadId?: number
  googleMapUrl?: string
  coord: [number, number]
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  pins: CctvInstallPin[]
  cameras: PanelCamera[]
}
