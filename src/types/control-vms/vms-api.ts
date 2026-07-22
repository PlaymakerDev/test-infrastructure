import { APIResponsePost, MetaData, SharedProject } from "../shared"
import { Camera, DesktopScreen } from "../vms/detail-api"

// DEPARTMENT
export type APIResponseVMSDepartment = VMSDepartmentList[]

export interface VMSDepartmentList {
  department_id: number
  department_short_name: string
  camera_online_count: number
  camera_offline_count: number
  /** Sum of tbl_notification_logs (source_type='vms_setting') rows since `?since=`, rolled up from every solution under this bureau. */
  noti_count: number
  sub_department: SubDepartment[]
}

export interface SubDepartment {
  department_id: number
  department_short_name: string
  camera_online_count: number
  camera_offline_count: number
  noti_count: number
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
  latitude: number
  longitude: number
  project: SharedProject
  desktop_screen: string
  last_connected: string
  /** LEGACY heartbeat (tv.last_connected within 30 min) — does NOT mean
   *  "can receive a Command Center dispatch". Use is_controllable for that. */
  is_online: boolean
  camera_online_count: number
  camera_offline_count: number
  noti_count: number
  /** Same tbl_vms_screen_info-derived truth as /vms/screen-info and
   *  /vms/command-center/monitor — single source for dispatch eligibility. */
  is_centralized: boolean
  is_controllable: boolean
}

// NOTIFICATIONS (per-VMS history — GET /vms/{vms_id}/notifications)
export type VMSNotificationStatus = 'info' | 'warning' | 'alert' | 'critical'

export interface VMSNotificationItem {
  category: string
  event_code: string
  event_name: string
  setting_type_id: number
  status: VMSNotificationStatus
  timestamp: string
  type_name: string
}

export interface APIResponseVMSNotifications {
  count: number
  items: VMSNotificationItem[]
}

// STATUS (composite health snapshot — GET /vms/{vms_id}/status)
export interface VMSStatusResponse {
  vms_id: number
  operation: {
    is_online: boolean
    label: 'ทำงานปกติ' | 'ขาดการเชื่อมต่อ'
    raw_status: number | null
  }
  stream: {
    is_online: boolean
    last_connected: string | null
  }
  box: {
    is_connected: boolean
    label: 'connect' | 'disconnect'
    connected_count: number
    total_count: number
  }
  last_setting: {
    setting_id: number
    setting_type_id: number | null
    type_name: string
    media_type: string
    status: number
  } | null
  zt_ip_address: string | null
}

// DETAILS (full solution detail — GET /vms/details/{solution_id})
export interface VMSDetails {
  id: number
  solution_id: number
  last_connected: string
  weather_id: number | null
  /** Absent entirely (not even `null`) for solutions with no crossing signal — confirmed live. */
  crossings?: {
    id: number
    vms_id: number
    wid: number
    crossing_master_index: string
  } | null
  desktop_screen: DesktopScreen | null
  solution: {
    id: number
    solution_name: string
    solution_type_id: number
    sta: string | null
    solution_location: {
      solution_location_id: number
      location_name: string
      project_roads: {
        project_road_id: number
        road: {
          id: number
          road_code: string
          road_name: string
        }
      }
    } | null
  }
  vms_camera: {
    id: number
    vms_id: number
    camera_id: string
    camera: Camera
  }[]
  vms_weather: {
    id: number
    road_id: number
    icon: string | null
    temp_url: string | null
    waqi_url: string | null
    weather_logs: {
      id: number
      weather_id: number
      hour_timestamp: string
      temperature: number
      humidity: number
      pm2: number
      aqi: number
      wind_speed: number
    }[]
  } | null
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

// GET MEDIA URLS
export interface APIRequestVMSMediaUrl {
  setting_type_id?: number | string
  limit?: number
  page?: number
  sort?: 'ASC' | 'DESC'
}

export interface APIResponseVMSMediaUrl {
  meta_data: MetaData
  res_data: VMSMediaUrlList[]
}

export interface VMSMediaUrlList {
  media_url: string
}