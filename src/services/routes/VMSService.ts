import { APIRequestVMSList, APIRequestVMSOverview, APIRequestVMSRandomOnline, APIRequestVMSTotal, APIResponseVMSList, APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "@/types/vms/overview-api"
import ApiService from "../ApiService"
import { centralScope } from "./scopeParam"
import { APIResponseVMSDetail } from "@/types/vms/detail-api"
import { APIRequestPostVMSPmChart, APIRequestPostVMSPmChartHour, APIResponsePostVMSPmChart } from "@/types/vms/pm-api"
import type {
  APIRequestScreenInfoAllowSettings,
  APIRequestScreenInfoCentralize,
  APIResponseScreenInfo,
  APIResponseScreenInfoAllowSettings,
  APIResponseScreenInfoCentralize,
} from "@/types/vms/screen-info-api"

export const getVMSOverviewAPI = async (
  deptId: string | number,
  params?: APIRequestVMSOverview
) => {
  return ApiService.fetchData<APIResponseVMSOverview, APIRequestVMSOverview>({
    url: `/vms/departments/${deptId}/overview`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId)
    },
  })
}

export const getVMSOverviewRandomOnlineAPI = async (
  deptId: string | number,
  params: APIRequestVMSRandomOnline
) => {
  return ApiService.fetchData<APIResponseVMSRandomOnline, APIRequestVMSRandomOnline>({
    url: `/vms/departments/${deptId}/overview/random-online`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId)
    }
  })
}

export const getVMSOverviewTotalAPI = async (
  deptId: string | number,
  params: APIRequestVMSTotal
) => {
  return ApiService.fetchData<APIResponseVMSTotal, APIRequestVMSTotal>({
    url: `/vms/departments/${deptId}/overview/central/totals`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId)
    },
  })
}

export const getVMSOverviewListAPI = async (
  deptId: string | number,
  params: APIRequestVMSList
) => {
  return ApiService.fetchData<APIResponseVMSList, APIRequestVMSList>({
    url: `/vms/departments/${deptId}/overview/central/list`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId)
    }
  })
}

export const getVMSDetailAPI = async (solutionId: string | number) => {
  return ApiService.fetchData<APIResponseVMSDetail>({
    url: `/vms/details/${solutionId}`,
    method: 'GET',
  })
}

// Inventory of every registered VMS wid with agent heartbeat + enixma state +
// centralized opt-in flag. Powers the Command Center STATUS tab and gates the
// dispatch UI (non-controllable/non-centralized signs are excluded).
export const getVMSScreenInfoAPI = async () => {
  return ApiService.fetchData<APIResponseScreenInfo>({
    url: `/vms/screen-info`,
    method: 'GET',
  })
}

// Toggle a wid into (or out of) the centralized control pool. Backend logs the
// change + optional reason for audit. Returns the updated row so we can patch
// the react-query cache without a full refetch.
export const putVMSScreenInfoCentralizeAPI = async (
  wid: number,
  data: APIRequestScreenInfoCentralize
) => {
  return ApiService.fetchData<APIResponseScreenInfoCentralize, APIRequestScreenInfoCentralize>({
    url: `/vms/screen-info/${wid}/centralize`,
    method: 'PUT',
    data,
  })
}

// Gates whether a sign appears in the departments (sidebar) tree at all —
// every automated crossing-creation path defaults this false, so newly
// migrated/synced signs need this reviewed once before they show up
// anywhere else in Command Center.
export const putVMSScreenInfoAllowSettingsAPI = async (
  wid: number,
  data: APIRequestScreenInfoAllowSettings
) => {
  return ApiService.fetchData<APIResponseScreenInfoAllowSettings, APIRequestScreenInfoAllowSettings>({
    url: `/vms/screen-info/${wid}/allow-settings`,
    method: 'PUT',
    data,
  })
}
// Power-meter chart for the detail page — same meter pipeline as
// bridge-lighting's `/bridge_lighting/pm-chart`, but keyed by solution_id
// (BE resolves the wid/meter group itself). Last ~24 h of 5-minute buckets.
export const postVMSPmChartAPI = async (data: APIRequestPostVMSPmChart) => {
  return ApiService.fetchData<APIResponsePostVMSPmChart, APIRequestPostVMSPmChart>({
    url: `/vms/pm-chart`,
    method: 'POST',
    data,
  })
}

// Hourly buckets over an explicit CE date range — feeds the นำออกเอกสาร
// modal, mirroring bridge-lighting's `/pm-chart-hour` contract.
export const postVMSPmChartHourAPI = async (data: APIRequestPostVMSPmChartHour) => {
  return ApiService.fetchData<APIResponsePostVMSPmChart, APIRequestPostVMSPmChartHour>({
    url: `/vms/pm-chart-hour`,
    method: 'POST',
    data,
  })
}
