import { APIResponsePost, MetaData, SharedProject } from "../shared"

// DEPARTMENT
export type APIResponseVMSDepartment = VMSDepartmentList[]

export interface VMSDepartmentList {
  department_id: number
  department_short_name: string
  camera_online_count: number
  camera_offline_count: number
  sub_department: SubDepartment[]
}

export interface SubDepartment {
  department_id: number
  department_short_name: string
  camera_online_count: number
  camera_offline_count: number
  roads: Road[]
}

export interface Road {
  road_id: number
  road_name: string
  road_code: string
  solution: Solution[]
}

export interface Solution {
  vms_id: number
  solution_id: number
  solution_name: string
  anydesk: string
  geo_point: number[]
  project: SharedProject
  desktop_screen: string
  last_connected: string
  is_online: boolean
  camera_online_count: number
  camera_offline_count: number
}

// SETTING TYPE
export type APIResponseVMSSettingType = VMSSettingType[]

export interface VMSSettingType {
  id: number
  name: string
}

// POST SETTING TYPE
export interface APIRequestPostVMSSettingType {
  name: string
}

export type APIResponsePostVMSSettingType = APIResponsePost

// PUT SETTING TYPE
export type APIRequestPutVMSSettingType = APIRequestPostVMSSettingType

export type APIResponsePutVMSSettingType = APIResponsePost

// DELETE SETTING TYPE
export type APIResponseDeleteVMSSettingType = APIResponsePost

// GET MEDIA
export interface APIRequestVMSMedia {
  setting_type_id?: number | string
  limit?: number
  page?: number
  sort?: 'ASC' | 'DESC'
  field?: string
  search?: string
}

export interface APIResponseVMSMedia {
  meta_data: MetaData
  res_data: VMSMediaList[]
}

export interface VMSMediaList {
  created_at: string
  crossing_master_index: string
  date_since: string
  date_to: string
  id: number
  is_all_day: boolean
  schedules: MediaSchedule[]
  setting_type: VMSSettingType
  setting_type_id: number
  status: number
  status_updated_at: string
  type_name: string
}

export interface MediaSchedule {
  days_of_week: number[]
  id: number
  media_url: string
  message: string
  schedule_name: string
  time_since: string
  time_to: string
}

// POST
export interface APIRequestPostVMSMedia {
  date_since: string
  date_to: string
  is_all_day: boolean
  schedules: VMSMediaSchedule[]
  setting_type_id: number
  type_name: string
  vms_ids: number[]
}

export interface VMSMediaSchedule {
  days_of_week: number[]
  media_url: string
  message: string
  schedule_name: string
  time_since: string
  time_to: string
}

export type APIResponsePostVMSMedia = APIResponsePost

// PUT
export interface APIRequestPutVMSMedia {
  date_since: string
  date_to: string
  is_all_day: boolean
  schedules: VMSMediaSchedule[]
  setting_type_id: number
  type_name: string
  vms_ids: number[]
}

export type APIResponsePutVMSMedia = APIResponsePost

// DELETE
export type APIResponseDeleteVMSMedia = APIResponsePost