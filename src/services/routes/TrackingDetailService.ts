import { APIRequestLast7Days, APIRequestPCU, APIRequestPositionByID, APIRequestRecentlyWeight, APIRequestStationDaily, APIRequestVehicleCountHour, APIRequestWIMDaily, APIRequestWIMTodayStats, APIResponseCalibrationHistoryStatus, APIResponseLast7Days, APIResponsePCU, APIResponsePositionByID, APIResponseRecentlyWeight, APIResponseStationByID, APIResponseStationDaily, APIResponseVehicleCountHour, APIResponseWIMByID, APIResponseWIMDaily, APIResponseWIMTodayStats } from "@/types/tracking/detail-api"
import ApiService from "../ApiService"
import { DEFAULT_TRACKING_API_URL } from "./TrackingService"

export const getTrackingStationByIDAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseStationByID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/masters/station/${id}`,
    method: 'GET',
  })
}

export const getTrackingWIMByIDAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseWIMByID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/masters/wim/${id}`,
    method: 'GET',
  })
}

export const getTrackingPositionByIDAPI = async (params: APIRequestPositionByID) => {
  return ApiService.fetchData<APIResponsePositionByID, APIRequestPositionByID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/position_by_id`,
    method: 'GET',
    params,
  })
}

export const getTrackingWIMTodayStatAPI = async (params: APIRequestWIMTodayStats) => {
  return ApiService.fetchData<APIResponseWIMTodayStats, APIRequestWIMTodayStats>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/wim_today_stats`,
    method: 'GET',
    params,
  })
}

export const getTrackingPCUAPI = async (params: APIRequestPCU) => {
  return ApiService.fetchData<APIResponsePCU, APIRequestPCU>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/pcu`,
    method: 'GET',
    params,
  })
}

export const getTrackingStationDailyAPI = async (params: APIRequestStationDaily) => {
  return ApiService.fetchData<APIResponseStationDaily, APIRequestStationDaily>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/station_daily`,
    method: 'GET',
    params,
  })
}

export const getTrackingWIMDailyAPI = async (params: APIRequestWIMDaily) => {
  return ApiService.fetchData<APIResponseWIMDaily, APIRequestWIMDaily>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/wim_daily`,
    method: 'GET',
    params,
  })
}

export const getTrackingCalibrationHistoryStatusAPI = async (stationType: string | number, id: string | number) => {
  return ApiService.fetchData<APIResponseCalibrationHistoryStatus>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/calibration-history/status/${stationType}/${id}`,
    method: 'GET',
  })
}

export const getTrackingLast7DaysAPI = async (params: APIRequestLast7Days) => {
  return ApiService.fetchData<APIResponseLast7Days, APIRequestLast7Days>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/last_7_days`,
    method: 'GET',
    params,
  })
}

export const getTrackingVehicleCountHourAPI = async (params: APIRequestVehicleCountHour) => {
  return ApiService.fetchData<APIResponseVehicleCountHour, APIRequestVehicleCountHour>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/vehical_count_hour`,
    method: 'GET',
    params,
  })
}

export const getTrackingRecentlyWeightAPI = async (params: APIRequestRecentlyWeight) => {
  return ApiService.fetchData<APIResponseRecentlyWeight, APIRequestRecentlyWeight>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/recently_weight`,
    method: 'GET',
    params,
  })
}