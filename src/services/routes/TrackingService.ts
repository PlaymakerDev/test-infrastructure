import { APIRequestTrackingCCTVList, APIRequestTrackingDailySum, APIRequestTrackingPosition, APIRequestTrackingSumWeightYearV2, APIRequestTrackingTotalStation, APIRequestTrackingViewSumPlanChart, APIRequestTrackingWeightInspection, APIResponseTrackingCCTVList, APIResponseTrackingDailySum, APIResponseTrackingPosition, APIResponseTrackingSumWeightYearV2, APIResponseTrackingTotalStation, APIResponseTrackingViewSumPlanChart, APIResponseTrackingWeightInspection, ProvinceData } from "@/types/tracking/overall-api"
import ApiService from "../ApiService"

const DEFAULT_TRACKING_API_URL = '/wim/redirect'

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