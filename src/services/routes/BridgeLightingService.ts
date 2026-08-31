import { APIRequestBridgeLightingList, APIRequestBridgeLightingOverview, APIRequestBridgeLightingTotal, APIRequestPostOpenBridgeLighting, APIRequestPostPmChart, APIRequestPostPmChartHour, APIRequestPostShellyStatus, APIResponseBridgeLightingList, APIResponseBridgeLightingOverview, APIResponseBridgeLightingTotal, APIResponseBridgeLightingWID, APIResponsePostOpenBridgeLighting, APIResponsePostPmChart, APIResponsePostShellyStatus } from "@/types/bridge-lighting/overall-api"
import ApiService from "../ApiService"

export const getBridgeLightingListAPI = async (id: string | number, params: APIRequestBridgeLightingList) => {
  return ApiService.fetchData<APIResponseBridgeLightingList, APIRequestBridgeLightingList>({
    url: `/bridge_lighting/departments/${id}/overview/central/list`,
    method: 'GET',
    params,
  })
}

export const getBridgeLightingTotalAPI = async (id: string | number, params: APIRequestBridgeLightingTotal) => {
  return ApiService.fetchData<APIResponseBridgeLightingTotal, APIRequestBridgeLightingTotal>({
    url: `/bridge_lighting/departments/${id}/overview/central/totals`,
    method: 'GET',
    params,
  })
}

export const getBridgeLightingOverviewAPI = async (id: string | number, params: APIRequestBridgeLightingOverview) => {
  return ApiService.fetchData<APIResponseBridgeLightingOverview, APIRequestBridgeLightingOverview>({
    url: `/bridge_lighting/departments/${id}/overview`,
    method: 'GET',
    params,
  })
}

export const getBridgeLightingWIDAPI = async (solutionId: string | number) => {
  return ApiService.fetchData<APIResponseBridgeLightingWID>({
    url: `/bridge_lighting/solutions/${solutionId}/wid`,
    method: 'GET',
  })
}

export const postBridgeLightingPmChartAPI = async (data: APIRequestPostPmChart) => {
  return ApiService.fetchData<APIResponsePostPmChart, APIRequestPostPmChart>({
    url: '/bridge_lighting/pm-chart',
    method: 'POST',
    data: { ...data },
  })
}

export const postBridgeLightingPmChartHourAPI = async (data: APIRequestPostPmChartHour) => {
  return ApiService.fetchData<APIResponsePostPmChart, APIRequestPostPmChartHour>({
    url: '/bridge_lighting/pm-chart-hour',
    method: 'POST',
    data: { ...data },
  })
}

export const postBridgeLightingShellyStatusAPI = async (data: APIRequestPostShellyStatus) => {
  return ApiService.fetchData<APIResponsePostShellyStatus, APIRequestPostShellyStatus>({
    url: '/bridge_lighting/shelly/status',
    method: 'POST',
    data: { ...data },
  })
}

export const postOpenBridgeLightingAPI = async (data: APIRequestPostOpenBridgeLighting) => {
  return ApiService.fetchData<APIResponsePostOpenBridgeLighting, APIRequestPostOpenBridgeLighting>({
    url: '/bridge_lighting/open-bridge-lighting',
    method: 'POST',
    data: { ...data },
  })
}