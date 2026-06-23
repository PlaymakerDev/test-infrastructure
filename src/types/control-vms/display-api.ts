import { VMSSettingType } from "./vms-api"

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
  department_short_name: string
  road_code: string
  settings: SettingByRoad[]
}

export interface SettingByRoad {
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
  date_count: string
  is_online: boolean
  setting_id: number
  since: string
  solution_name: string
  to: string
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
  created_at: string
  created_by: string
  setting_type: VMSSettingType
}

// PUT MEDIA BY ID BODY
export interface APIPutVMSMediaById {
  media_url: string
  message: string
  setting_type_id: number
  since: string
  to: string
  type_name: string
}