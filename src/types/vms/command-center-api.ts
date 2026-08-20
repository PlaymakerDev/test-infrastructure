export interface VMSMonitorItem {
  vms_id: number
  wid: number
  crossing_master_index: string
  solution_name: string
  sta?: string
  road_code?: string
  road_name?: string
  anydesk_id?: string
  /** LEGACY heartbeat (tv.last_connected within 30 min) — does NOT mean
   *  "can receive a Command Center dispatch". Use is_controllable for that. */
  is_online: boolean
  last_seen_at?: string
  last_connected?: string
  /** Same tbl_vms_screen_info-derived truth as /vms/screen-info and the
   *  departments (sidebar) endpoint — single source for dispatch eligibility. */
  is_centralized: boolean
  /** Has this sign's agent EVER checked in. False = never provisioned —
   *  needs a technician, not a "wait for it to reconnect" queue-ahead. */
  is_reported: boolean
  is_controllable: boolean
  setting_id?: number
  command_no?: number
  status?: number
  status_name?: string
  status_updated_at?: string
  setting_type_name?: string
  media_url?: string
  message?: string
  date_since?: string
  date_to?: string
  is_all_day?: boolean
  time_since?: string
  time_to?: string
  days_of_week?: number
}

export type APIResponseVMSMonitor = VMSMonitorItem[]

export interface APIRequestVMSMonitor {
  vms_ids: number[]
}

export interface VMSGlobalHistoryItem {
  id: number
  setting_id: number
  crossing_master_index: string
  vms_id?: number
  wid?: number
  solution_name?: string
  sta?: string
  road_code?: string
  command_no?: number
  prev_status: number | null
  status: number
  prev_status_name?: string
  status_name: string
  source: string
  changed_by?: string
  reported_at: string
  setting_type_name?: string
  media_url?: string
}

export type APIResponseVMSGlobalHistory = VMSGlobalHistoryItem[]

export interface APIRequestVMSGlobalHistory {
  from?: string
  to?: string
  limit?: number
}

export interface VMSSignCamera {
  camera_id: string
  camera_name: string
  hls_url: string
  ip_address: string
  ping_status: boolean
  curl_status: boolean
}

export interface VMSSignSchedule {
  id: number
  schedule_name: string
  media_url: string
  message: string
  time_since: string
  time_to: string
  days_of_week: number
}

export interface VMSSignDetail extends VMSMonitorItem {
  desktop_screen_url?: string
  video_timestamp?: string
  /** Install-point coordinate — powers the header's Google Map button.
   *  Added to this endpoint 2026-08-05; may be null for un-geotagged signs. */
  latitude?: number | null
  longitude?: number | null
  schedules: VMSSignSchedule[]
  cameras: VMSSignCamera[]
}

export type APIResponseVMSSignDetail = VMSSignDetail

/**
 * Multi-ชุดคำสั่ง dispatch body (2026-08-20) — one call carries N settings for
 * the same target signs. Each setting keeps its own date range, all-day flag,
 * category and schedule windows; the Composer builds one entry per
 * "ชุดคำสั่งที่ N" card. Field order below mirrors the agreed sample body.
 */
export interface VMSDispatchSchedule {
  days_of_week: number[]
  media_url: string
  message: string
  schedule_name: string
  time_since: string
  time_to: string
}

export interface VMSDispatchSetting {
  date_since: string
  date_to: string
  is_all_day: boolean
  schedules: VMSDispatchSchedule[]
  setting_type_id: number
  type_name: string
}

export interface APIRequestVMSDispatch {
  settings: VMSDispatchSetting[]
  vms_ids: number[]
}
