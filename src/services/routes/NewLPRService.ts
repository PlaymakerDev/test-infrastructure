import {
  APIRequestLPROverview,
  APIRequestLPRList,
  APIResponseLPROverview,
  APIResponseLPRList,
  APIRequestLPRTotal,
  APIResponseLPRTotal,
  APIRequestLPRRandomOnline,
  APIResponseLPRRandomOnline
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

