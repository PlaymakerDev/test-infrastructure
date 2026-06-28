import { APIRequestVMSSettingByRoad, APIRequestVMSSettingList, APIRequestVMSSettingSchedule, APIResponseVMSMediaById, APIResponseVMSSettingByRoad, APIResponseVMSSettingList, APIResponseVMSSettingSchedule, APIResponseVMSUpcomingSummary } from "@/types/control-vms/display-api"
import ApiService from "../ApiService"
import {
  APIResponseVMSDepartment,
  APIResponseVMSSettingType,
  APIRequestVMSMedia,
  APIResponseVMSMedia,
  APIRequestPostVMSMedia,
  APIResponsePostVMSMedia,
  APIRequestPutVMSMedia,
  APIResponsePutVMSMedia,
  APIResponseDeleteVMSMedia
} from "@/types/control-vms/vms-api"

// VMS
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

// DISPLAY
export const getVMSSettingUpcomingSummaryAPI = async () => {
  return ApiService.fetchData<APIResponseVMSUpcomingSummary>({
    url: `/vms/settings/upcoming-summary`,
    method: 'GET',
  })
}

export const getVMSSettingByRoadAPI = async (params: APIRequestVMSSettingByRoad) => {
  return ApiService.fetchData<APIResponseVMSSettingByRoad, APIRequestVMSSettingByRoad>({
    url: `/vms/settings/by-road`,
    method: 'GET',
    params: { ...params }
  })
}

export const getVMSSettingScheduleAPI = async (params: APIRequestVMSSettingSchedule) => {
  return ApiService.fetchData<APIResponseVMSSettingSchedule, APIRequestVMSSettingSchedule>({
    url: `/vms/settings/schedule`,
    method: 'GET',
    params: { ...params }
  })
}

// `id` accepts schedule.setting_id — backend aliases it for GET/PUT/DELETE /vms/settings/media/{id}
export const getVMSMediaByIDAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseVMSMediaById>({
    url: `/vms/settings/media/${id}`,
    method: 'GET',
  })
}

// LIST
export const getVMSSettingListAPI = async (params: APIRequestVMSSettingList) => {
  return ApiService.fetchData<APIResponseVMSSettingList, APIRequestVMSSettingList>({
    url: `/vms/settings/list`,
    method: 'GET',
    params: { ...params }
  })
}

// `id` accepts schedule.setting_id — same alias as GET above
export const putVMSMediaAPI = async (id: string | number, data: APIRequestPutVMSMedia) => {
  return ApiService.fetchData<APIResponsePutVMSMedia, APIRequestPutVMSMedia>({
    url: `/vms/settings/media/${id}`,
    method: 'PUT',
    data: { ...data },
  })
}

// `id` accepts schedule.setting_id — same alias as GET above
export const deleteVMSMediaAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseDeleteVMSMedia>({
    url: `/vms/settings/media/${id}`,
    method: 'DELETE',
  })
}