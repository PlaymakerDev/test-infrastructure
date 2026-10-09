import {
  APIRequestLPROverview,
  APIRequestLPRList,
  APIResponseLPROverview,
  APIResponseLPRList,
  APIRequestLPRTotal,
  APIResponseLPRTotal,
  APIRequestLPRRandomOnline,
  APIResponseLPRRandomOnline,
  APIRequestLPRDailyCount,
  APIResponseLPRDailyCount,
  APIRequestLPRPlate,
  APIResponseLPRPlate,
  APIRequestLPRPlateList,
  APIResponseLPRPlateList,
  APIResponseLPRStat,
  APIRequestLPRHourlyCount,
  APIResponseLPRHourlyCount,
  APIResponseSolutionCamera
} from "@/types/lpr/new-lpr-api"
import ApiService from "../ApiService"

export const getLPROverviewAPI = async (id: string | number, params: APIRequestLPROverview) => {
  return ApiService.fetchData<APIResponseLPROverview, APIRequestLPROverview>({
    url: `/lpr/departments/${id}/overview`,
    method: 'GET',
    params,
  })
}

export const getLPRListAPI = async (id: string | number, params: APIRequestLPRList) => {
  return ApiService.fetchData<APIResponseLPRList, APIRequestLPRList>({
    url: `/lpr/departments/${id}/overview/central/list`,
    method: 'GET',
    params,
  })
}

export const getLPRTotalAPI = async (id: string | number, params: APIRequestLPRTotal) => {
  return ApiService.fetchData<APIResponseLPRTotal, APIRequestLPRTotal>({
    url: `/lpr/departments/${id}/overview/central/totals`,
    method: 'GET',
    params,
  })
}

export const getLPRRandomOnlineAPI = async (id: string | number, params: APIRequestLPRRandomOnline) => {
  return ApiService.fetchData<APIResponseLPRRandomOnline, APIRequestLPRRandomOnline>({
    url: `/lpr/departments/${id}/cameras/random-online`,
    method: 'GET',
    params,
  })
}

export const getLPRDailyCountAPI = async (solutionId: string | number, params: APIRequestLPRDailyCount) => {
  return ApiService.fetchData<APIResponseLPRDailyCount, APIRequestLPRDailyCount>({
    url: `/lpr/solutions/${solutionId}/cameras/daily-count`,
    method: 'GET',
    params,
  })
}

export const getLPRHourlyCountAPI = async (solutionId: string | number, params: APIRequestLPRHourlyCount) => {
  return ApiService.fetchData<APIResponseLPRHourlyCount, APIRequestLPRHourlyCount>({
    url: `/lpr/solutions/${solutionId}/hourly-count`,
    method: 'GET',
    params,
  })
}

export const getLPRPlateAPI = async (solutionId: string | number, params: APIRequestLPRPlate) => {
  return ApiService.fetchData<APIResponseLPRPlate, APIRequestLPRPlate>({
    url: `/lpr/solutions/${solutionId}/plates`,
    method: 'GET',
    params,
    timeout: 30000, // 30 seconds timeout for the request
  })
}

export const getLPRPlateListAPI = async (solutionId: string | number, params: APIRequestLPRPlateList) => {
  return ApiService.fetchData<APIResponseLPRPlateList, APIRequestLPRPlateList>({
    url: `/lpr/solutions/${solutionId}/plates/list`,
    method: 'GET',
    params,
  })
}

export const getLPRStatAPI = async (solutionId: string | number) => {
  return ApiService.fetchData<APIResponseLPRStat>({
    url: `/lpr/solutions/${solutionId}/stats`,
    method: 'GET',
  })
}

export const getLPRSolutionCameraAPI = async (solutionId: string | number) => {
  return ApiService.fetchData<APIResponseSolutionCamera>({
    url: `/lpr/solutions/${solutionId}/cameras`,
    method: 'GET',
  })
}