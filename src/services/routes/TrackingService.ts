import { APIRequestTrackingAllDepartment, APIRequestTrackingCCTVList, APIRequestTrackingCollaboration, APIRequestTrackingDailySum, APIRequestTrackingMobileMaster, APIRequestTrackingPosition, APIRequestTrackingSumMobile, APIRequestTrackingSumStation, APIRequestTrackingSumWeightYearV2, APIRequestTrackingSumWim, APIRequestTrackingTotalStation, APIRequestTrackingViewSumPlanChart, APIRequestTrackingWeightInspection, APIResponseTrackingAllDepartment, APIResponseTrackingCCTVList, APIResponseTrackingCollaboration, APIResponseTrackingDailySum, APIResponseTrackingMobileMaster, APIResponseTrackingPosition, APIResponseTrackingSumMobile, APIResponseTrackingSumStation, APIResponseTrackingSumWeightYearV2, APIResponseTrackingSumWim, APIResponseTrackingTotalStation, APIResponseTrackingViewSumPlanChart, APIResponseTrackingWeightInspection, ProvinceData } from "@/types/tracking/overall-api"
import ApiService from "../ApiService"

export const DEFAULT_TRACKING_API_URL = '/wim/redirect'

export const getTrackingCCTVListAPI = async (params: APIRequestTrackingCCTVList) => {
  return ApiService.fetchData<APIResponseTrackingCCTVList, APIRequestTrackingCCTVList>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/cctv/list`,
    method: 'GET',
    params,
  })
}

export const getTrackingDailySumAPI = async (params: APIRequestTrackingDailySum) => {
  return ApiService.fetchData<APIResponseTrackingDailySum, APIRequestTrackingDailySum>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/daily_weighed_vehicles_sum`,
    method: 'GET',
    params,
  })
}

export const getTrackingTotalStationAPI = async (params: APIRequestTrackingTotalStation) => {
  return ApiService.fetchData<APIResponseTrackingTotalStation, APIRequestTrackingTotalStation>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/total_station`,
    method: 'GET',
    params,
  })
}

export const getTrackingWeightInspectionAPI = async (params: APIRequestTrackingWeightInspection) => {
  return ApiService.fetchData<APIResponseTrackingWeightInspection, APIRequestTrackingWeightInspection>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/vehicle_weight_inspection`,
    method: 'GET',
    params,
  })
}

export const getTrackingSumWeightYearV2API = async (params: APIRequestTrackingSumWeightYearV2) => {
  return ApiService.fetchData<APIResponseTrackingSumWeightYearV2, APIRequestTrackingSumWeightYearV2>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/sum_weight_year_v2`,
    method: 'GET',
    params,
  })
}

export const getTrackingViewSumPlanChartAPI = async (params: APIRequestTrackingViewSumPlanChart) => {
  return ApiService.fetchData<APIResponseTrackingViewSumPlanChart, APIRequestTrackingViewSumPlanChart>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/view_sum_plan_chart`,
    method: 'GET',
    params,
  })
}

export const getTrackingPositionAPI = async (params: APIRequestTrackingPosition) => {
  return ApiService.fetchData<APIResponseTrackingPosition, APIRequestTrackingPosition>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/position`,
    method: 'GET',
    params,
  })
}

export const getTrackingPositionProvinceAPI = async () => {
  return ApiService.fetchData<ProvinceData[]>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/position/province`,
    method: 'GET',
  })
}

export const getTrackingSumStationAPI = async (params: APIRequestTrackingSumStation) => {
  return ApiService.fetchData<APIResponseTrackingSumStation, APIRequestTrackingSumStation>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/daily_weighed_vehicles_sum_station`,
    method: 'GET',
    params,
  })
}

export const getTrackingSumWIMAPI = async (params: APIRequestTrackingSumWim) => {
  return ApiService.fetchData<APIResponseTrackingSumWim, APIRequestTrackingSumWim>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/daily_weighed_vehicles_sum_wim`,
    method: 'GET',
    params,
  })
}

export const getTrackingSumMobileAPI = async (params: APIRequestTrackingSumMobile) => {
  return ApiService.fetchData<APIResponseTrackingSumMobile, APIRequestTrackingSumMobile>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/dashboards/daily_weighed_vehicles_sum_spot`,
    method: 'GET',
    params,
  })
}

export const getTrackingCollaborationAPI = async (params: APIRequestTrackingCollaboration) => {
  return ApiService.fetchData<APIResponseTrackingCollaboration, APIRequestTrackingCollaboration>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/collaboration`,
    method: 'GET',
    params,
  })
}

export const getTrackingMobileMasterAPI = async (params: APIRequestTrackingMobileMaster) => {
  return ApiService.fetchData<APIResponseTrackingMobileMaster, APIRequestTrackingMobileMaster>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/weight/mobile_master`,
    method: 'GET',
    params,
  })
}

// DEPARTMENT
export const getTrackingAllDepartmentAPI = async (params: APIRequestTrackingAllDepartment) => {
  return ApiService.fetchData<APIResponseTrackingAllDepartment, APIRequestTrackingAllDepartment>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/masters/departments_all`,
    method: 'GET',
    params,
  })
}