import { APIRequestVMSList, APIRequestVMSRandomOnline, APIResponseVMSList, APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "@/types/vms/overview-api"
import ApiService from "../ApiService"

export const getVMSOverviewAPI = async (deptId: string | number) => {
  return ApiService.fetchData<APIResponseVMSOverview>({
    url: `/vms/departments/${deptId}/overview`,
    method: 'GET',
  })
}

export const getVMSOverviewRandomOnlineAPI = async (deptId: string | number, params: APIRequestVMSRandomOnline) => {
  return ApiService.fetchData<APIResponseVMSRandomOnline[]>({
    url: `/vms/departments/${deptId}/overview/random-online`,
    method: 'GET',
    params: { ...params }
  })
}

export const getVMSOverviewTotalAPI = async (deptId: string | number) => {
  return ApiService.fetchData<APIResponseVMSTotal>({
    url: `/vms/departments/${deptId}/overview/totals`,
    method: 'GET',
  })
}

export const getVMSOverviewListAPI = async (deptId: string | number, params: APIRequestVMSList) => {
  return ApiService.fetchData<APIResponseVMSList>({
    url: `/vms/departments/${deptId}/overview/list`,
    method: 'GET',
    params: { ...params }
  })
}
