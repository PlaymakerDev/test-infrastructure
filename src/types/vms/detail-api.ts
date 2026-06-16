export interface APIResponseVMSDetail {
  id: number
  solution_id: number
  weather_id: number
  last_connected: string
  vms_weather?: VmsWeather
  solution: Solution
  vms_camera?: VmsCamera[]
  desktop_screen: DesktopScreen
}

export interface VmsWeather {
  id: number
  waqi_url: string
  temp_url: string
  icon: string
  road_id: number
  weather_logs: WeatherLog[]
}

export interface WeatherLog {
  id: number
  weather_id: number
  hour_timestamp: string
  wind_speed: number
  temperature: number
  humidity: number
  pm2: number
  aqi: number
}

export interface Solution {
  id: number
  solution_location_id: number
  solution_type_id: number
  sta: string
  solution_name: string
  ip_address: string
  zt_ip_address: string
  geometry_point: number[]
  remarks: string
  anydesk: string
  created_at: string
  created_by: string
  updated_by: string
  updated_at: string
  solution_location: SolutionLocation
}

export interface SolutionLocation {
  solution_location_id: number
  project_id: number
  location_name: string
  created_at: string
  created_by: string
  project_roads: ProjectRoads
}

export interface ProjectRoads {
  project_road_id: number
  project_id: number
  road_id: number
  road: Road
}

export interface Road {
  id: number
  road_name: string
  road_code: string
  subdistrict: string
  district: string
  province: string
  department_id: number
  start_sta: string
  end_sta: string
  distance: number
  created_at: string
  created_by: string
}

export interface VmsCamera {
  id: number
  vms_id: number
  camera_id: string
  camera: Camera
}

export interface Camera {
  id: string
  ip_address: string
  department_id: number
  road_id: number
  solution_id: number
  camera_name: string
  sta: string
  hls_url: string
  point_geometry: number[]
  remark: string
  created_by: string
  created_at: string
  ping_updated: string
  ping_status: boolean
  curl_updated: string
  curl_status: boolean
  contractor_id: string
  updated_at: string
}

export interface DesktopScreen {
  id: number
  vms_id: number
  desktop_screen: string
  video_timestamp: string
}