import { APIRequestVMSList, APIRequestVMSRandomOnline, APIResponseVMSList, APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "@/types/vms/overview-api"
import ApiService from "../ApiService"
import { centralScope } from "./scopeParam"
import { APIResponseVMSDetail } from "@/types/vms/detail-api"
import type {
  APIRequestScreenInfoAllowSettings,
  APIRequestScreenInfoCentralize,
  APIResponseScreenInfo,
  APIResponseScreenInfoAllowSettings,
  APIResponseScreenInfoCentralize,
} from "@/types/vms/screen-info-api"

export const getVMSOverviewAPI = async (deptId: string | number) => {
  return ApiService.fetchData<APIResponseVMSOverview>({
    url: `/vms/departments/${deptId}/overview`,
    method: 'GET',
    params: centralScope(deptId),
  })
}

export const getVMSOverviewRandomOnlineAPI = async (deptId: string | number, params: APIRequestVMSRandomOnline) => {
  return ApiService.fetchData<APIResponseVMSRandomOnline[]>({
    url: `/vms/departments/${deptId}/overview/random-online`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) }
  })
}

export const getVMSOverviewTotalAPI = async (deptId: string | number) => {
  return ApiService.fetchData<APIResponseVMSTotal>({
    url: `/vms/departments/${deptId}/overview/central/totals`,
    method: 'GET',
    params: centralScope(deptId),
  })
}

export const getVMSOverviewListAPI = async (deptId: string | number, params: APIRequestVMSList) => {
  return ApiService.fetchData<APIResponseVMSList>({
    url: `/vms/departments/${deptId}/overview/central/list`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) }
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