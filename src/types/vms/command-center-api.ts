export interface VMSMonitorItem {
  vms_id: number
  wid: number
  crossing_master_index: string
  solution_name: string
  sta?: string
  road_code?: string
  road_name?: string
  is_online: boolean
  last_seen_at?: string
  last_connected?: string
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
  schedules: VMSSignSchedule[]
  cameras: VMSSignCamera[]
}

export type APIResponseVMSSignDetail = VMSSignDetail
