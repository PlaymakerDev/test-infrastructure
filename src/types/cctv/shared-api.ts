import { SharedSolution } from "../shared"

export interface APIResponseCCTVDetail {
  id: string
  camera_name: string
  sta: string
  ip_address: string
  hls_url: string
  geometry_point: number[]
  remark: string
  // SHARED
  counting?: SharedSolution
  analytic?: SharedSolution
  traffic?: SharedSolution
  crosswalk?: SharedSolution
  wim_camera?: SharedSolution
  vms?: SharedSolution
}