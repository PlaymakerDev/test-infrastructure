import ApiService from "../ApiService"
import {
  APIResponseVMSDepartment,
  APIResponseVMSSettingType,
  APIRequestVMSMedia,
  APIResponseVMSMedia,
  APIRequestPostVMSMedia,
  APIResponsePostVMSMedia
} from "@/types/control-vms/vms-api"

export const getVMSDepartmentAPI = async () => {
  return ApiService.fetchData<APIResponseVMSDepartment>({
    url: `/vms/settings/departments`,
    method: 'GET',
  })
}

export const getVMSSettingTypeAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingType>({
    url: `/vms/settings/types`,
    method: 'GET',
  })
}

export const getVMSMediaAPI = async (params: APIRequestVMSMedia) => {
  return ApiService.fetchData<APIResponseVMSMedia, APIRequestVMSMedia>({
    url: `/vms/settings/media`,
    method: 'GET',
    params: { ...params }
  })
}

export const postVMSMediaAPI = async (data: APIRequestPostVMSMedia) => {
  return ApiService.fetchData<APIResponsePostVMSMedia, APIRequestPostVMSMedia>({
    url: '/vms/settings/media',
    method: 'POST',
    data: { ...data },
  })
}