import { APIRequestAnalyticProvinceTraffic, APIRequestAnalyticWeeklyPattern, APIRequestHourlyTraffic, APIRequestTopActiveTruck, APIRequestVehicleHistory, APIRequestVehicleRouteHistory, APIResponseAnalyticProvinceTraffic, APIResponseAnalyticVehicleType, APIResponseAnalyticWeeklyPattern, APIResponseFleetKPI, APIResponseHourlyTraffic, APIResponseProvinceSummary, APIResponseTopActiveTruck, APIResponseVehicleHistory, APIResponseVehicleRouteHistory } from "@/types/tracking/detail-gps-api"
import ApiService from "../ApiService"
import { DEFAULT_TRACKING_API_URL } from "./TrackingService"

export const getTrackingGPSProvinceSummaryAPI = async () => {
  return ApiService.fetchData<APIResponseProvinceSummary>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/province_summary`,
    method: 'GET',
  })
}

export const getTrackingGPSFleetKpiAPI = async () => {
  return ApiService.fetchData<APIResponseFleetKPI>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/fleet_kpi`,
    method: 'GET',
  })
}

export const getTrackingGPSTopActiveTruckAPI = async (params: APIRequestTopActiveTruck) => {
  return ApiService.fetchData<APIResponseTopActiveTruck, APIRequestTopActiveTruck>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/top_active_trucks`,
    method: 'GET',
    params,
  })
}

export const getTrackingGPSVehicleHistoryAPI = async (params: APIRequestVehicleHistory) => {
  return ApiService.fetchData<APIResponseVehicleHistory, APIRequestVehicleHistory>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/vehicle_history`,
    method: 'GET',
    params,
  })
}

export const getTrackingGPSVehicleRouteHistoryAPI = async (params: APIRequestVehicleRouteHistory) => {
  return ApiService.fetchData<APIResponseVehicleRouteHistory, APIRequestVehicleRouteHistory>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/vehicle_route_history`,
    method: 'GET',
    params,
  })
}

export const getTrackingGPSAnalyticVehicleTypeAPI = async () => {
  return ApiService.fetchData<APIResponseAnalyticVehicleType>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/analytics_vehicle_types`,
    method: 'GET',
  })
}

export const getTrackingGPSHourlyTrafficAPI = async (params: APIRequestHourlyTraffic) => {
  return ApiService.fetchData<APIResponseHourlyTraffic, APIRequestHourlyTraffic>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/hourly_traffic`,
    method: 'GET',
    params,
  })
}

export const getTrackingGPSAnalyticWeeklyPatternAPI = async (params: APIRequestAnalyticWeeklyPattern) => {
  return ApiService.fetchData<APIResponseAnalyticWeeklyPattern, APIRequestAnalyticWeeklyPattern>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/analytics_weekly_pattern`,
    method: 'GET',
    params,
  })
}

export const getTrackingGPSAnalyticProvinceTrafficAPI = async (params: APIRequestAnalyticProvinceTraffic) => {
  return ApiService.fetchData<APIResponseAnalyticProvinceTraffic, APIRequestAnalyticProvinceTraffic>({
    url: `${DEFAULT_TRACKING_API_URL}/api/v1/info/analytics_province_traffic`,
    method: 'GET',
    params,
  })
}
