import { SharedSolution } from "../shared"

export interface APIResponseCCTVDetail {
  id: string
  camera_name: string
  sta: string
  ip_address: string
  hls_url: string
  geometry_point: number[]
  remark: string
  /** Hardware fields — added by BE (may be null until populated). */
  serial_number: string | null
  model: string | null
  brand: string | null
  is_online: boolean
  /** Pre-formatted Thai duration string for offline cameras (e.g.
   *  "3 วัน 2 ชั่วโมง 10 นาที"); null while the camera is online. */
  offline_duration: string | null
  curl_updated_at: string
  // SHARED
  counting?: SharedSolution
  analytic?: SharedSolution
  traffic?: SharedSolution
  crosswalk?: SharedSolution
  wim_camera?: SharedSolution
  vms?: SharedSolution
}

/** GET /cctv/{id} — distinct from GET /cctv/cameras/{id} (APIResponseCCTVDetail
 *  above). This one carries `road_code`, which the camera-detail endpoint doesn't. */
export interface APIResponseCCTVRoad {
  id: string
  camera_name: string
  road_code: string
  hls_url: string
  solutions: { solution_type_id: number; solution_name: string }[]
}