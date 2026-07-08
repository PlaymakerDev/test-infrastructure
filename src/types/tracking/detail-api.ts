import { WIMMetaData } from "../shared"

// STATION BY ID
export interface APIResponseStationByID {
  success: boolean
  data: StationData
}

export interface StationData {
  station_id: number
  station_name: string
  station_description: string
  location_description: string
  station_type: number
  province_id: number
  latitude: string
  longtitude: string
  total: number
  over: number
  is_enable: number
  enf_id: any
  ip_address: string
  last_update: string
  department_id: number
  delivery_year: string
  update_year: any
  kilometer_position: any
  side: any
  contract_number: any
  contractor_name: any
  remark: any
}

export interface APIResponseWIMByID extends Omit<APIResponseStationByID, 'data'> {
  data: WIMData
}

// WIM BY ID
export interface WIMData {
  station_id: number
  station_name: string
  station_description: string
  location_description: string
  station_type: number
  province_id: number
  latitude: string
  longtitude: string
  total: number
  over: number
  is_enable: number
  enf_id: any
  ip_address: string
  last_update: string
  owner: string
  department_id: number
  delivery_year: any
  update_year: any
  kilometer_position: any
  side: any
  contract_number: any
  contractor_name: any
  remark: any
}

// POSITION BY ID
export interface APIRequestPositionByID {
  station_id?: string
  StationType?: string
}

export type APIResponsePositionByID = PositionByIDData[]

export interface PositionByIDData {
  StationID: number
  Latitude: string
  Longtitude: string
  StationName: string
  StationDescription: string
  LocationDescription: string
  isEnable: number
  Total: number
  Over: number
}

// WIM TODAY STATS
export interface APIRequestWIMTodayStats {
  station_id?: string
}

export interface APIResponseWIMTodayStats extends Omit<APIResponseStationByID, 'data'> {
  data: WIMTodayStatsData
}

export interface WIMTodayStatsData {
  total: number
  over: number
  over_10percent: number
}

// PCU
export interface APIRequestPCU {
  station_id?: string
  date?: string
}

export interface APIResponsePCU extends Omit<APIResponseStationByID, 'data'> {
  data: PCUData
}

export interface PCUData {
  total_pcu: string
  percent_truck: string
  aadt: string
}

// CALIBRATION HISTORY STATUS
export interface APIResponseCalibrationHistoryStatus {
  status: string
  latestCalibration: LatestCalibration
  daysUntilExpiry: number
}

export interface LatestCalibration {
  id: number
  stationType: number
  stationId: number
  departmentId: any
  calibrationDate: string
  calibrationBy: string
  calibrationCompany: string
  certificateNo: string
  nextCalibrationDate: string
  calibrationResult: string
  remark: string
  attachmentPath: any
  createdBy: string
  createdAt: string
  updatedBy: any
  updatedAt: string
  station: CalibrateStation
  wim: CalibrateWIM
}

export interface CalibrateStation {
  station_id: number
  station_name: string
  station_description: string
  location_description: string
  station_type: number
  province_id: number
  latitude: string
  longtitude: string
  total: number
  over: number
  is_enable: number
  enf_id: any
  ip_address: string
  last_update: string
  department_id: number
  delivery_year: string
  update_year: any
  kilometer_position: any
  side: any
  contract_number: any
  contractor_name: any
  remark: any
}

export interface CalibrateWIM {
  station_id: number
  station_name: string
  station_description: string
  location_description: string
  station_type: number
  province_id: number
  latitude: string
  longtitude: string
  total: number
  over: number
  is_enable: number
  enf_id: any
  ip_address: string
  last_update: string
  owner: string
  department_id: number
  delivery_year: string
  update_year: string
  kilometer_position: string
  side: string
  contract_number: string
  contractor_name: string
  remark: string
}

// STATION DAILY
export interface APIRequestStationDaily {
  start_date?: string
  end_date?: string
  station_id?: string
  page?: number
  page_size?: number
  ordering?: 'asc' | 'desc'
}

export interface APIResponseStationDaily {
  success: boolean
  is_over10percent_count: number
  data: StationDailyData[]
  meta: WIMMetaData
}

export interface StationDailyData {
  isover_10percent: number
  remark: string
  station_id: number
  station_name: string
  total: number
  total_over: number
  date_time: string
  date_time_ct: string
}

// WIM DAILY
export type APIRequestWIMDaily = APIRequestStationDaily

export interface APIResponseWIMDaily extends Omit<APIResponseStationDaily, 'data'> {
  data: WIMDailyData[]
}

export interface WIMDailyData {
  isover_10percent: number
  avg_esal: string
  max_esal: string
  remark: string
  station_id: number
  station_name: string
  total: number
  total_over: number
  date_time: string
  date_time_ct: string
}

// LAST 7 DAYS
export interface APIRequestLast7Days {
  station_id?: string
  date_type?: 'day' | 'month' | 'year'
  reference_date?: string
}

export interface APIResponseLast7Days {
  column: string[]
  total: number[]
  over: number[]
  esal: number[]
}

// VEHICLE COUNT HOUR
export type APIRequestVehicleCountHour = Omit<APIRequestLast7Days, 'reference_date'>

export interface APIResponseVehicleCountHour {
  column: string[]
  value: string[]
}