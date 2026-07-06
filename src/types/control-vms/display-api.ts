import { APIResponsePost, MetaData, SharedProject } from "../shared"
import { VMSSettingType } from "./vms-api"

// UPCOMING SUMMARY
export interface APIResponseVMSUpcomingSummary {
  count: SettingCount
  upcoming: SettingUpcoming
}

export interface SettingCount {
  disconnected_count: number
  most_bureau: string
  most_bureau_percent: number
  playing_count: number
  settings_count: number
}

export interface SettingUpcoming {
  setting_type_id: number
  setting_type_name: string
  solution_name: string
}

// SETTING BY ROAD
export interface APIRequestVMSSettingByRoad {
  road_code?: string
}

export type APIResponseVMSSettingByRoad = VMSSettingByRoad[]

export interface VMSSettingByRoad {
  department_short_name: string
  region_name: string
  road_code: string
  settings: SettingByRoad[]
}

export interface SettingByRoad {
  display_hour: string
  end_date: string
  is_online: boolean
  setting_type_name: string
  settings_content: string
  solution_name: string
  start_date: string
  status: number
  status_name: string
}

// SETTING SCHEDULE
export interface APIRequestVMSSettingSchedule {
  month?: number
  year?: number
}

// SETTING SCHEDULE BY DATE (keys are dynamic ISO date strings, e.g. "2026-07-01")
export type APIResponseVMSScheduleByDate = Record<string, VMSScheduleByDate[]>

export interface VMSScheduleByDate {
  setting_id: number
  date: string
  time_since: string
  time_to: string
  solution_name: string
  road_code: string
  anydesk: string
  date_count: string
  status: number
  status_name: string
  is_online: boolean
}

// MEDIA BY ID
export interface APIResponseVMSMediaById {
  id: number
  crossing_master_index: string
  type_name: string
  status: number
  status_name: string
  status_updated_at: string
  setting_type_id: number
  setting_type_name: string
  solution_name: string
  department_id: number
  department_short_name: string
  stch: number
  date_since: string
  date_to: string
  is_all_day: boolean
  date_count: string
  created_at: string
  schedules: MediaScheduleByID[]
}

export interface MediaScheduleByID {
  days_of_week: number[]
  id: number
  media_url: string
  message: string
  schedule_name: string
  time_since: string
  time_to: string
}

// LIST
export interface APIRequestVMSSettingList {
  search?: string
  page?: number
  limit?: number
  field?: string
  sort?: 'ASC' | 'DESC'
}

export type APIResponseVMSSettingList = {
  meta_data: MetaData
  res_data: VMSSettingList[]
}

export interface VMSSettingList {
  anydesk: string
  camera_offline_count: number
  camera_online_count: number
  desktop_screen: string
  geo_point: number[]
  is_online: boolean
  last_connected: string
  project: SharedProject
  solution_id: number
  solution_name: string
  vms_id: number
}

// SETTING BY STATUS
export interface APIRequestVMSSettingByStatus {
  status_id?: number
}

export type APIResponseVMSSettingByStatus = VMSSettingByStatus[]

export interface VMSSettingByStatus {
  vms_id: number
  setting_id: number
  type_name: string
  status: number
  status_name: string
  is_all_day: boolean
  is_online: boolean
  start_date: string
  end_date: string
  road_code: string
  solution_name: string
  screen_capture_url: string
  cameras: CameraByStatus[]
  schedules: ScheduleByStatus[]
}

export interface CameraByStatus {
  camera_id: string
  camera_name: string
  hls_url: string
}

export interface ScheduleByStatus {
  days_of_week: number[]
  schedule_id: number
  schedule_name: string
  time_since: string
  time_to: string
}

// BATCH DELETE
export interface APIRequestPostVMSBatchDelete {
  schedule_ids: number[]
}

export type APIResponsePostVMSBatchDelete = APIResponsePost

// STATUS COUNT
export type APIResponseVMSSettingStatusCount = VMSSettingStatusCount[]

export interface VMSSettingStatusCount {
  count: number
  status_id: number
  status_name: string
}

// STATUS
export type APIResponseVMSSettingStatus = VMSSettingType[]

// BY VMS ID
export interface APIRequestVMSSettingByVMSID {
  vms_ids?: number[]
}

export type APIResponseVMSSettingByVMSID = VMSSettingByVMSID[]

export interface VMSSettingByVMSID {
  schedule: ScheduleByVMSID[]
  solution_name: string
  status: number
  status_name: string
}

export interface ScheduleByVMSID {
  schedule_name: string
  time_since: string
  time_to: string
}