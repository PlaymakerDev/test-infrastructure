import { APIRequestLast7Days, APIRequestMobileCar, APIRequestMobileMaster, APIRequestPCU, APIRequestPositionByID, APIRequestRecentlyWeight, APIRequestStationDaily, APIRequestStationDailyCount, APIRequestVehicleCountHour, APIRequestWeightStationLog, APIRequestWeightWIMLog, APIRequestWeightWIMLogByID, APIRequestWIMDaily, APIRequestWIMDailyCount, APIRequestWIMTodayStats, APIResponseCalibrationHistory, APIResponseCalibrationHistoryStatus, APIResponseLast7Days, APIResponseMobileCar, APIResponseMobileCarByTDID, APIResponseMobileMaster, APIResponseMobileMasterDepartmentByTID, APIResponsePCU, APIResponsePositionByID, APIResponseRecentlyWeight, APIResponseStationByID, APIResponseStationDaily, APIResponseStationDailyCount, APIResponseTrafficAvgSpeed, APIResponseVehicleCountHour, APIResponseWeightStationLog, APIResponseWeightStationLogByID, APIResponseWeightWIMLog, APIResponseWeightWIMLogByID, APIResponseWIMByID, APIResponseWIMDaily, APIResponseWIMDailyCount, APIResponseWIMTodayStats } from "@/types/tracking/detail-api"
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

export const getTrackingCalibrationHistoryAPI = async (stationType: string | number, id: string | number) => {
  return ApiService.fetchData<APIResponseCalibrationHistory>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/calibration-history/history/${stationType}/${id}`,
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

export const getTrackingWeightWIMLogAPI = async (params: APIRequestWeightWIMLog) => {
  return ApiService.fetchData<APIResponseWeightWIMLog, APIRequestWeightWIMLog>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_wim_log`,
    method: 'GET',
    params,
  })
}

export const getTrackingWeightWIMLogByIDAPI = async (tdid: string | number, params: APIRequestWeightWIMLogByID) => {
  return ApiService.fetchData<APIResponseWeightWIMLogByID, APIRequestWeightWIMLogByID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_wim_log/${tdid}`,
    method: 'GET',
    params,
  })
}

export const getTrackingWeightStationLogAPI = async (params: APIRequestWeightStationLog) => {
  return ApiService.fetchData<APIResponseWeightStationLog, APIRequestWeightStationLog>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_station_log`,
    method: 'GET',
    params,
  })
}

export const getTrackingWeightStationLogByIDAPI = async (tdid: string | number) => {
  return ApiService.fetchData<APIResponseWeightStationLogByID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_station_log/${tdid}`,
    method: 'GET',
  })
}

export const getTrackingTrafficAvgSpeedAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseTrafficAvgSpeed>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/masters/wim/traffic_avg_speed/${id}`,
    method: 'GET',
  })
}

export const getTrackingStationDailyCountAPI = async (params: APIRequestStationDailyCount) => {
  return ApiService.fetchData<APIResponseStationDailyCount, APIRequestStationDailyCount>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/station_daily_status_count`,
    method: 'GET',
    params,
  })
}

export const getTrackingWIMDailyCountAPI = async (params: APIRequestWIMDailyCount) => {
  return ApiService.fetchData<APIResponseWIMDailyCount, APIRequestWIMDailyCount>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/wim_daily_status_count`,
    method: 'GET',
    params,
  })
}

export const getTrackingMobileMasterDepartmentByTIDAPI = async (tid: string | number) => {
  return ApiService.fetchData<APIResponseMobileMasterDepartmentByTID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_mobile_master_department/${tid}`,
    method: 'GET',
  })
}

export const getTrackingMobileCarAPI = async (params: APIRequestMobileCar) => {
  return ApiService.fetchData<APIResponseMobileCar, APIRequestMobileCar>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_mobile_car`,
    method: 'GET',
    params,
  })
}

export const getTrackingMobileCarByTDIDAPI = async (tdid: string | number) => {
  return ApiService.fetchData<APIResponseMobileCarByTDID>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/weight_mobile_car/${tdid}`,
    method: 'GET',
  })
}

export const getTrackingMobileMasterAPI = async (params: APIRequestMobileMaster) => {
  return ApiService.fetchData<APIResponseMobileMaster, APIRequestMobileMaster>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/mobile_master`,
    method: 'GET',
    params,
  })
}