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
  /** Aggregate — currently equal to `stream_status` (the HLS stream
   *  works). Kept for consumers that don't distinguish the two signals. */
  is_online: boolean
  /** Device is reachable via ICMP ping. May be false when a camera is on
   *  a different NAT/subnet than the health-check worker but its stream
   *  still serves fine — a "device offline / stream online" panel needs
   *  both fields. */
  ping_status?: boolean
  /** The HLS/curl probe succeeds. Same value as `is_online` today. */
  stream_status?: boolean
  /** Pre-formatted Thai duration string for offline cameras (e.g.
   *  "3 วัน 2 ชั่วโมง 10 นาที"); null while the camera is online. */
  offline_duration: string | null
  curl_updated_at: string
  /** Last successful ICMP ping timestamp — may lag `curl_updated_at`. */
  ping_updated_at?: string | null
  // SHARED
  counting?: SharedSolution
  analytic?: SharedSolution
  traffic?: SharedSolution
  crosswalk?: SharedSolution
  wim_camera?: SharedSolution
  vms?: SharedSolution
}