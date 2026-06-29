import { WIMMetaData } from "../shared"

// CCTV LIST
export interface APIRequestTrackingCCTVList {
  page?: number
  page_size?: number
  department_id?: string | number
  station_type_id?: string | number
  station_type?: string
  station_id?: string | number
}

export interface APIResponseTrackingCCTVList {
  data: CCTVList[]
  meta: WIMMetaData
  success: boolean
}

export interface CCTVList {
  camera_description: string
  camera_ip: string
  camera_status: string
  camera_type: string
  department_id: number
  department_name: string
  id: number
  last_update: string
  station_description: string
  station_id: number
  station_type_desc: string
  station_type_id: number
  station_type_name: string
  stream_url: string
}

// DAILY SUM
export interface APIRequestTrackingDailySum {
  date?: string
}

export interface APIResponseTrackingDailySum {
  data: DailySumData
  success: boolean
}

export interface DailySumData {
  all_sum: AllDailySum
  items: DailySumItem[]
}

export interface AllDailySum {
  over: number
  total: number
}

export interface DailySumItem {
  create_date: string
  over: string
  station_type: number
  station_type_desc: string
  station_type_eng: string
  total: string
}

// TOTAL STATION
export type APIRequestTrackingTotalStation = APIRequestTrackingDailySum

export interface APIResponseTrackingTotalStation {
  mobile: TotalMobile
  wim: TotalWim
  station: TotalStation
}

export interface TotalMobile {
  total: string
  open: string
}

export interface TotalWim {
  open: string
  total: string
}

export interface TotalStation {
  open: string
  total: string
}

// WEIGHT INSPECTION
export interface APIRequestTrackingWeightInspection {
  date?: string
  number_day?: number
  station_type_id?: number
  date_type?: '7Day' | 'month' | 'year'
}

export interface APIResponseTrackingWeightInspection {
  data: WeightInspectionData[]
  success: boolean
}

export interface WeightInspectionData {
  create_date: string
  date_value: string
  over: string
  over_title: string
  total: string
  total_title: string
}

// SUM WEIGHT YEAR V2
export interface APIRequestTrackingSumWeightYearV2 {
  previous_year?: number
}

export interface APIResponseTrackingSumWeightYearV2 {
  data: SumWeightYearData
  success: boolean
}

export interface SumWeightYearData {
  data: SumWeightData[]
  summary: SumWeightSummary[]
}

export interface SumWeightData {
  all_total: number
  arrest_total: number
  judge_total: number
  note?: string
  plan_total: number
  result_total: number
  spot_check_total: number
  station_total: number
  way_id_total: number
  wim_total: number
  year_total: number
}

export interface SumWeightSummary {
  all_total: string
  arrest_total: string
  judge_total: string
  note: string
  plan_total: string
  result_total: string
  spot_check_total: string
  station_total: string
  way_id_total: string
  wim_total: string
  year_total: string
}

// VIEW SUM PLAN CHART
export interface APIRequestTrackingViewSumPlanChart {
  year?: number
  department_id?: string
}

export interface APIResponseTrackingViewSumPlanChart {
  all_sum: ViewSumPlanChartAllSum
  item: ViewSumPlanChartItem[]
  plan_year: string
}

export interface ViewSumPlanChartAllSum {
  plan_total: number
  result_total: number
}

export interface ViewSumPlanChartItem {
  month: string
  plan: number
  result: number
  year: string
}

// POSITION
export interface APIRequestTrackingPosition {
  ProvinceID?: string
  StationType?: '1' | '2' | '3'
}

export interface APIResponseTrackingPosition {
  station: PositionStation[]
  wim: PositionWim[]
  mobile: PositionMobile[]
  location: PositionLocation[]
}

export interface PositionStation {
  StationID: number
  StationName: string
  StationDescription: string
  LocationDescription: string
  Latitude: string
  Longtitude: string
  isEnable: number
  Total: number
  Over: number
}

export interface PositionWim {
  StationID: number
  StationName: string
  StationDescription: string
  LocationDescription: string
  Latitude: string
  Longtitude: string
  isEnable: number
  Total: number
  Over: number
}

export interface PositionMobile {
  TID: number
  Latitude: string
  Longtitude: string
  WayID: string
  first_name: string
  last_name: string
}

export interface PositionLocation {
  latitude?: string
  longitude?: string
}

// POSITION PROVINCE
export interface ProvinceData {
  ProvinceID: string
  ProvinceName: string
}

// SUM STATION
export type APIRequestTrackingSumStation = APIRequestTrackingDailySum

export interface APIResponseTrackingSumStation {
  success: boolean
  data: SumStation[]
}

export interface SumStation {
  station_id: number
  name: string
  station_type: number
  delivery_year: string
  update_year: any
  kilometer_position: any
  contract_number: any
  contractor_name: any
  station_type_desc: string
  station_type_eng: string
  create_date: string
  total: string
  over: string
  total_cctv: string
  offline_cctv: string
}

// SUM WIM
export interface APIRequestTrackingSumWim {
  date?: string
  owner?: string
}

export interface APIResponseTrackingSumWim {
  success: boolean
  data: SumWim[]
}

export interface SumWim {
  station_id: number
  name: string
  station_type: number
  delivery_year?: string
  update_year?: string
  kilometer_position?: string
  contract_number?: string
  contractor_name?: string
  station_type_desc: string
  station_type_eng: string
  create_date: string
  total: string
  over: string
  over_10percent: string
  total_cctv: string
  offline_cctv: string
}

// SUM MOBILE
export type APIRequestTrackingSumMobile = APIRequestTrackingDailySum

export interface APIResponseTrackingSumMobile {
  success: boolean
  data: SumMobile[]
}

export interface SumMobile {
  name: string
  department_id: number
  contract_number: any
  station_type: string
  create_date: string
  station_type_desc: string
  station_type_eng: string
  total: string
  over: string
}