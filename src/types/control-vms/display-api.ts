import { MetaData, SharedProject } from "../shared"

// UPCOMING SUMMARY
export interface APIResponseVMSUpcomingSummary {
  count: SettingCount
  upcoming: SettingUpcoming
}

export interface SettingCount {
  most_bureau: string
  most_bureau_percent: number
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
  road_code: string
  department_short_name: string
  region_name: string
  settings: SettingByRoad[]
}

export interface SettingByRoad {
  setting_id?: number
  display_hour: string
  is_online: boolean
  setting_type_name: string
  settings_content: string
  since: string
  solution_name: string
  to: string
}

// SETTING SCHEDULE
export interface APIRequestVMSSettingSchedule {
  month?: number
  year?: number
}

export type APIResponseVMSSettingSchedule = VMSSettingSchedule[]

export interface VMSSettingSchedule {
  setting_id: number
  solution_name: string
  road_code: string
  anydesk: string
  since: string
  to: string
  is_online: boolean
  date_count: string
}

// MEDIA BY ID
export interface APIResponseVMSMediaById {
  id: number
  crossing_master_index: string
  type_name: string
  media_url: string
  since: string
  to: string
  message: string
  setting_type_id: number
  setting_type_name: string
  solution_name: string
  department_id: number
  department_short_name: string
  stch: number
  date_count: string
  created_at: string
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