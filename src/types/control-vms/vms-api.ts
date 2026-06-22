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
  created_by: string
  crossing_master_index: string
  id: number
  media_url: string
  message: string
  setting_type: VMSSettingType
  setting_type_id: number
  since: string
  to: string
  type_name: string
}

// POST
export interface APIRequestPostVMSMedia {
  media_url: string
  message: string
  setting_type_id: number
  since: string
  to: string
  type_name: string
  vms_ids: number[]
}

export type APIResponsePostVMSMedia = APIResponsePost