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

export type APIResponseCalibrationHistory = CalibrationHistoryData[]

export interface CalibrationHistoryData {
  attachmentPath: any
  calibrationBy: string
  calibrationCompany: string
  calibrationDate: string
  calibrationResult: string
  certificateNo: string
  createdAt: string
  createdBy: string
  department: any
  departmentId: any
  id: number
  nextCalibrationDate: string
  remark: string
  station: CalibrateHistoryStation
  stationId: number
  stationType: number
  updatedAt: string
  updatedBy: any
  wim: CalibrateHistoryWIM
}

export interface CalibrateHistoryStation {
  contract_number: any
  contractor_name: any
  delivery_year: string
  department_id: number
  enf_id: any
  ip_address: string
  is_enable: number
  kilometer_position: any
  last_update: string
  latitude: string
  location_description: string
  longtitude: string
  over: number
  province_id: number
  remark: any
  side: any
  station_description: string
  station_id: number
  station_name: string
  station_type: number
  total: number
  update_year: any
}

export interface CalibrateHistoryWIM {
  contract_number: any
  contractor_name: any
  delivery_year: any
  department_id: number
  enf_id: any
  ip_address: string
  is_enable: number
  kilometer_position: any
  last_update: string
  latitude: string
  location_description: string
  longtitude: string
  over: number
  owner: string
  province_id: number
  remark: any
  side: any
  station_description: string
  station_id: number
  station_name: string
  station_type: number
  total: number
  update_year: any
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
  station_status?: 'normal' | 'abnormal' | 'wim_disconnected'
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

// RECENTLY WEIGHT
export interface APIRequestRecentlyWeight {
  station_id?: string
  limit?: number
  station_type?: string
}

export type APIResponseRecentlyWeight = RecentlyWeightData[]

export interface RecentlyWeightData {
  TDID: string
  license_plate: string
  weight: string
  VehicleClassDesc: string
  VehicleClassID: number
  status: number
}

// WEIGHT WIM LOG
export interface APIRequestWeightWIMLog {
  start_date?: string
  end_date?: string
  station?: number
  page?: number
  page_size?: number
  is_over_weight?: string
  ordering?: 'asc' | 'desc'
}

export interface APIResponseWeightWIMLog {
  data: WeightWIMLogData[]
  meta: WeightWIMLogMeta
}

export interface WeightWIMLogData {
  td_id: string
  t_id: string
  time_stamp: string
  time_stamp_date: string
  time_stamp_time: string
  today: string
  enf_id: string
  station_id: number
  station_name: string
  vehicle_class_id: number
  metrial_name: any
  lp_head_no: string
  lp_head_province_id: string
  province_name: string
  lp_tail_no: any
  lp_tail_province_id: any
  gross_weight: string
  gross_weight_over: string
  legal_weight: string
  over10percent: string
  axle_left_01: any
  axle_left_02: any
  axle_left_03: any
  axle_left_04: any
  axle_left_05: any
  axle_left_06: any
  axle_left_07: any
  axle_right_01: any
  axle_right_02: any
  axle_right_03: any
  axle_right_04: any
  axle_right_05: any
  axle_right_06: any
  axle_right_07: any
  display_type: number
  is_over_weight: string
  driver_name: any
  image_02_name: string
  image_01_name: string
  vehicle_class_desc2: string
  vehicle_class_desc3: string
  lp_head_province_name: string
  lp_head_province_id_ppa: number
  lp_tail_province_name: any
  lp_tail_province_id_ppa: any
  is_arrested: any
  vehicle_class_name: string
  vehicle_class_desc: string
  vehicle_class_legal_weight: string
  vehicle_class_legal_drive_shaft: string
  vehicle_class_legal_drive_shaft_ref: string
  vehicle_class_id_ref: number
  axle_01_weight: any
  axle_02_weight: any
  axle_03_weight: any
  axle_04_weight: any
  axle_05_weight: any
  axle_06_weight: any
  axle_07_weight: any
  axle_08_weight: any
  axle_09_weight: any
  axle_10_weight: any
  axle_11_weight: any
  axle_12_weight: any
  axle_13_weight: any
  axle_14_weight: any
  axle_count: string
  is_over_weight_desc: string
}

export interface WeightWIMLogMeta {
  page: number
  total: number
  page_size: string
  page_count: number
  has_previous_page: boolean
  has_next_page: boolean
  summary: MetaSummary
}

export interface MetaSummary {
  total: number
  overweight: number
  is_over_10_percent: number
}

// WEIGHT WIM LOG BY ID
export interface APIRequestWeightWIMLogByID {
  station_type?: string
}

export interface APIResponseWeightWIMLogByID {
  success: boolean
  data: WeightWIMLogByIDData
}

export interface WeightWIMLogByIDData {
  over10percent: number
  td_id: string
  t_id: string
  enf_id: string
  station_id: number
  time_stamp: string
  vehicle_class_id: number
  material_name: any
  lp_head_no: string
  lp_head_province_id: string
  lp_tail_no: any
  lp_tail_province_id: any
  gross_weight: string
  legal_weight: string
  gross_weight_over: string
  is_over_weight: string
  driver_name: any
  last_update: string
  image_01_name: string
  image_02_name: string
  vehicle_number: any
  axle_count: string
  lane: string
  speed: string
  length: any
  front_over_hang: any
  rear_over_hang: any
  esal: any
  esal2: any
  esal3: any
  axle_01_seperation: any
  axle_01_weight: any
  axle_01_max: any
  axle_01_group: any
  axle_01_tire_code: any
  axle_02_seperation: any
  axle_02_weight: any
  axle_02_max: any
  axle_02_group: any
  axle_02_tire_code: any
  axle_03_seperation: any
  axle_03_weight: any
  axle_03_max: any
  axle_03_group: any
  axle_03_tire_code: any
  axle_04_seperation: any
  axle_04_weight: any
  axle_04_max: any
  axle_04_group: any
  axle_04_tire_code: any
  axle_05_seperation: any
  axle_05_weight: any
  axle_05_max: any
  axle_05_group: any
  axle_05_tire_code: any
  axle_06_seperation: any
  axle_06_weight: any
  axle_06_max: any
  axle_06_group: any
  axle_06_tire_code: any
  axle_07_seperation: any
  axle_07_weight: any
  axle_07_wax: any
  axle_07_group: any
  axle_07_tire_code: any
  axle_08_seperation: any
  axle_08_weight: any
  axle_08_max: any
  axle_08_group: any
  axle_08_tire_code: any
  axle_09_seperation: any
  axle_09_weight: any
  axle_09_max: any
  axle_09_group: any
  axle_09_tire_code: any
  axle_10_seperation: any
  axle_10_weight: any
  axle_10_max: any
  axle_10_group: any
  axle_10_tire_code: any
  axle_11_weight: any
  axle_11_seperation: any
  axle_11_max: any
  axle_11_group: any
  axle_11_tire_code: any
  axle_12_seperation: any
  axle_12_weight: any
  axle_12_max: any
  axle_12_group: any
  axle_12_tire_code: any
  axle_13_seperation: any
  axle_13_weight: any
  axle_13_max: any
  axle_13_group: any
  axle_13_tire_code: any
  axle_14_seperation: any
  axle_14_weight: any
  axle_14_max: any
  axle_14_group: any
  axle_14_tire_code: any
  axle_left_01: any
  axle_right_01: any
  axle_left_02: any
  axle_right_02: any
  axle_left_03: any
  axle_right_03: any
  axle_left_04: any
  axle_right_04: any
  axle_left_05: any
  axle_right_05: any
  axle_left_06: any
  axle_right_06: any
  axle_left_07: any
  axle_right_07: any
  axle_left_08: any
  axle_right_08: any
  axle_left_09: any
  axle_right_09: any
  axle_left_10: any
  axle_right_10: any
  axle_left_11: any
  axle_right_11: any
  axle_left_12: any
  axle_right_12: any
  axle_left_13: any
  axle_right_13: any
  axle_left_14: any
  axle_right_14: any
  display_type: number
  is_arrested: any
  wim: Wim
  vehicle_class: VehicleClass
  lp_head_province: LpHeadProvince
  lp_tail_province: any
  is_over_weight_desc: string
  province_name: string
  driver_shaft_over: any
}

export interface VehicleClass {
  id: number
  vehicle_class_id: number
  vehicle_class_id_ref: number
  vehicle_class_name: string
  vehicle_class_desc: string
  legal_weight: string
  drive_shaft: string
  drive_shaft_ref: string
  vehicle_class_desc2: string
  vehicle_class_desc3: string
  is_deleted: any
}

export interface Wim {
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
  ip_address: any
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

export interface LpHeadProvince {
  id: number
  name: string
  id_ppa: number
}

// WEIGHT STATION LOG
export type APIRequestWeightStationLog = APIRequestWeightWIMLog

export interface APIResponseWeightStationLog {
  data: WeightStationLogData[]
  meta: WeightWIMLogMeta
}

export interface WeightStationLogData {
  td_id: string
  t_id: string
  time_stamp: string
  enf_id: string
  station_id: number
  station_name: string
  vehicle_class_id: number
  meterial_name: any
  lp_head_no: string
  lp_head_province_id: string
  province_name: string
  lp_tail_no: any
  lp_tail_province_id: any
  gross_weight: string
  grossweight_over: string
  legal_weight: string
  axle_left_01: any
  axle_left_02: any
  axle_left_03: any
  axle_left_04: any
  axle_left_05: any
  axle_left_06: any
  axle_left_07: any
  axle_right_01: any
  axle_right_02: any
  axle_right_03: any
  axle_right_04: any
  axle_right_05: any
  axle_right_06: any
  axle_right_07: any
  display_type: number
  is_over_weight: string
  drive_name: any
  lp_head_province_name: string
  lp_head_province_id_ppa: number
  lp_tail_province_name: any
  lp_tail_province_id_ppa: any
  vehicle_class_name: string
  vehicle_class_desc2: string
  vehicle_class_desc3: string
  vehicle_class_desc: string
  vehicle_class_legal_weight: string
  vehicle_class_legal_drive_shaft: string
  vehicle_class_legal_drive_shaft_ref: string
  vehicle_class_id_ref: number
  is_over_weight_desc: string
}

// WEIGHT STATION LOG BY ID
export interface APIResponseWeightStationLogByID {
  success: boolean
  data: WeightStationLogByIDData
}
export interface WeightStationLogByIDData {
  td_id: string
  t_id: string
  enf_id: string
  station_id: number
  time_stamp: string
  vehicle_class_id: number
  material_name: any
  image_01_name: string
  image_02_name: string
  lp_head_no: string
  lp_head_province_id: string
  lp_tail_no: any
  lp_tail_province_id: any
  gross_weight: string
  gross_weight_over: string
  legal_weight: string
  is_over_weight: string
  driver_name: any
  last_update: string
  axle_left_01: any
  axle_right_01: any
  axle_left_02: any
  axle_right_02: any
  axle_left_03: any
  axle_right_03: any
  axle_left_04: any
  axle_right_04: any
  axle_left_05: any
  axle_right_05: any
  axle_left_06: any
  axle_right_06: any
  axle_left_07: any
  axle_right_07: any
  axle_left_08: any
  axle_right_08: any
  axle_left_09: any
  axle_right_09: any
  axle_left_10: any
  axle_right_10: any
  axle_left_11: any
  axle_right_11: any
  axle_left_12: any
  axle_right_12: any
  axle_left_13: any
  axle_right_13: any
  axle_left_14: any
  axle_right_14: any
  display_type: number
  is_arrested: any
  station: Station
  vehicle_class: VehicleClass
  lp_head_province: LpHeadProvince
  lp_tail_province: any
  is_over_weight_desc: string
  driver_shaft_over: any
}

export interface Station {
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
  ip_address: any
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

// TRAFFIC AVG SPEED
export type APIResponseTrafficAvgSpeed = TrafficAvgSpeedData[]

export interface TrafficAvgSpeedData {
  pid: number
  period: string
  period_name: string
  vehicle_count: string
  avg_speed: string
}

// STATION DAILY STATUS COUNT
export interface APIRequestStationDailyCount {
  start_date?: string
  end_date?: string
  station_id?: string | number
}

export interface APIResponseStationDailyCount {
  data: StationDailyCountData
  success: boolean
}

export interface StationDailyCountData {
  abnormal: number
  camera_offline: number
  camera_online: number
  max_grossweight_not_over: number
  max_grossweight_over: number
  normal: number
  station_count: number
  sum_isover_10percent: number
  sum_total: number
  sum_total_over: number
  top_region: string
  top_region_percent: number
  top_region_station_count: number
  total: number
  wim_disconnected: number
}

// WIM DAILY STATUS COUNT
export type APIRequestWIMDailyCount = APIRequestStationDailyCount

export type APIResponseWIMDailyCount = APIResponseStationDailyCount

// MOBILE DAILY STATUS COUNT
export interface APIRequestMobileDailyCount {
  start_date?: string
  end_date?: string
  department_id?: string | number
  tid?: string | number
}

export interface APIResponseMobileDailyCount extends Omit<APIResponseStationDailyCount, 'data'> {
  data: MobileDailyCountData
}

export interface MobileDailyCountData {
  actual: number
  axis_over_gross_weight: number
  fiscal_year: number
  max_grossweight_not_over: number
  max_grossweight_over: number
  max_grossweight_over_percent: number
  open_station_count: number
  plan: number
  sum_total: number
  sum_total_over: number
  top_region: any
  top_region_open_count: number
  top_region_percent: number
  total_station_count: number
  weight_axis_over_count: number
}

// MOBILE CAR
export interface APIRequestMobileCar {
  tid?: string | number
  search?: string
  is_over_weight?: number | string
  page?: number
  page_size?: number
}

export interface APIResponseMobileCar extends Omit<APIResponseStationByID, 'data'> {
  data: MobileCarData
}

export interface MobileCarData {
  data: MobileCarList[]
  meta: WIMMetaData
}

export interface MobileCarList {
  accept_weight: any
  accept_weight_by: any
  arrest_id: any
  create_date: string
  drive_shaft_over?: string
  driver_name: any
  driver_shaft: string
  ds_1: string
  ds_2: string
  ds_3?: string
  ds_4?: string
  ds_5?: string
  ds_6?: string
  ds_7?: string
  gross_weight: string
  gross_weight_over: any
  image_path0: string
  image_path1: string
  image_path2: string
  image_path3: string
  image_path4: string
  image_path5: string
  image_path6: string
  is_arrested: number
  is_over_weight: string
  is_over_weight_desc: string
  legal_weight: string
  lp_head: string
  lp_head_no: string
  lp_head_province_id: number
  lp_head_province_id_ppa: number
  lp_head_province_name: string
  lp_tail: string
  lp_tail_no: string
  lp_tail_province_id?: number
  lp_tail_province_id_ppa?: number
  lp_tail_province_name?: string
  masterial_name: string
  t_id: string
  td_id: string
  tdid_sort: number
  vehicle_class_desc: string
  vehicle_class_desc2: string
  vehicle_class_desc3: string
  vehicle_class_id: number
  vehicle_class_id_ref: number
  vehicle_class_legal_drive_shaft: string
  vehicle_class_legal_drive_shaft_ref: string
  vehicle_class_legal_weight: string
  vehicle_class_name: string
}

// MOBILE MASTER DEPARTMENT BY TID
export interface APIResponseMobileMasterDepartmentByTID extends Omit<APIResponseStationByID, 'data'> {
  data: MobileMasterDepartmentByTIDData
}

export interface MobileMasterDepartmentByTIDData {
  FirstName: string
  LastName: string
  Title: string
  Total: string
  TotalOver: string
  collaboration: string
  create_by: string
  create_date: string
  dept_id: number
  dept_province: string
  district: string
  image_name1: string
  image_name2: string
  image_path1: string
  image_path2: string
  is_open: number
  km_from: string
  km_to: string
  latitude: string
  longitude: string
  province: string
  sub_district: string
  tid: string
  time_from: string
  time_to: string
  way_id: string
  way_name: string
}

// MOBILE CAR BY TDID
export interface APIResponseMobileCarByTDID extends Omit<APIResponseStationByID, 'data'> {
  data: MobileCarByTDIDData[]
}

export interface MobileCarByTDIDData {
  create_date: string
  td_id: string
  t_id: string
  vehicle_class_id: number
  vehicle_class_id_ref: number
  masterial_name: string
  lp_head_no: string
  lp_head_province_id: number
  lp_tail_no: string
  lp_tail_province_id: number
  lp_head: string
  lp_tail: string
  driver_shaft: string
  accept_weight: any
  accept_weight_by: any
  ds_1: string
  ds_2: string
  ds_3: string
  ds_4: string
  ds_5: string
  ds_6: string
  ds_7: any
  vehicle_class_desc: string
  gross_weight: string
  gross_weight_over: any
  legal_weight: string
  is_over_weight_desc: string
  is_over_weight: string
  drive_shaft_over: string
  driver_name: any
  image_path1: string
  image_path2: string
  image_path3: string
  image_path4: string
  image_path5: string
  image_path6: string
  vehicle_class_name: string
  vehicle_class_desc2: string
  vehicle_class_desc3: string
  vehicle_class_legal_weight: string
  vehicle_class_legal_drive_shaft: string
  vehicle_class_legal_drive_shaft_ref: string
  lp_head_province_name: string
  lp_head_province_id_ppa: number
  lp_tail_province_name: string
  lp_tail_province_id_ppa: number
}

// MOBILE MASTER
export interface APIRequestMobileMaster {
  start_date?: string
  end_date?: string
  branch?: string
  search?: string
  is_join?: number
  is_open?: number
  page?: number
  page_size?: number
  ordering?: 'asc' | 'desc'
}

export interface APIResponseMobileMaster extends Omit<APIResponseStationByID, 'data'> {
  data: MobileMasterData[]
  meta: WIMMetaData
}

export interface MobileMasterData {
  TID: string
  DeptID: number
  DeptName: string
  Collaboration: string
  DeptProvince: string
  WayID: string
  WayName: string
  Subdistrict: string
  District: string
  Province: string
  CreateBy: string
  Title: string
  FirstName: string
  LastName: string
  image_name1?: string
  image_path1?: string
  image_name2?: string
  image_path2?: string
  CreateDate: string
  TimeFrom: string
  TimeTo: string
  IsOpen: number
  Total: string
  TotalOver: string
  KMFrom: string
  KMTo: string
}