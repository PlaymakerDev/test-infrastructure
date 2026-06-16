import { APIRequestVMSList, APIRequestVMSRandomOnline, APIResponseVMSList, APIResponseVMSOverview, APIResponseVMSRandomOnline, APIResponseVMSTotal } from "@/types/vms/overview-api"
import ApiService from "../ApiService"
import { APIResponseVMSDetail } from "@/types/vms/detail-api"

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
    url: `/vms/departments/${deptId}/overview/central/totals`,
    method: 'GET',
  })
}

export const getVMSOverviewListAPI = async (deptId: string | number, params: APIRequestVMSList) => {
  return ApiService.fetchData<APIResponseVMSList>({
    url: `/vms/departments/${deptId}/overview/central/list`,
    method: 'GET',
    params: { ...params }
  })
}

export const getVMSDetailAPI = async (solutionId: string | number) => {
  return ApiService.fetchData<APIResponseVMSDetail>({
    url: `/vms/details/${solutionId}`,
    method: 'GET',
  })
}