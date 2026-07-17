import { APIRequestPostVMSBatchDelete, APIRequestVMSSettingByRoad, APIRequestVMSSettingByStatus, APIRequestVMSSettingByVMSID, APIRequestVMSSettingList, APIRequestVMSSettingSchedule, APIResponsePostVMSBatchDelete, APIResponseVMSMediaById, APIResponseVMSScheduleByDate, APIResponseVMSSettingByRoad, APIResponseVMSSettingByStatus, APIResponseVMSSettingByVMSID, APIResponseVMSSettingLatest, APIResponseVMSSettingList, APIResponseVMSSettingStatus, APIResponseVMSSettingStatusCount, APIResponseVMSUpcomingSummary } from "@/types/control-vms/display-api"
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
  APIResponseDeleteVMSMedia,
  APIRequestPostVMSSettingType,
  APIResponsePostVMSSettingType,
  APIRequestPutVMSSettingType,
  APIResponsePutVMSSettingType,
  APIResponseDeleteVMSSettingType,
  APIResponseVMSNotifications,
  VMSStatusResponse,
  VMSDetails
} from "@/types/control-vms/vms-api"

// VMS
export const getVMSDepartmentAPI = async (params?: { since?: string }) => {
  return ApiService.fetchData<APIResponseVMSDepartment>({
    url: `/vms/settings/departments`,
    method: 'GET',
    params,
  })
}

// GET NOTIFICATIONS (per-VMS history)
export const getVMSNotificationsAPI = async (vmsId: number | string, params: { start_date: string; end_date: string }) => {
  return ApiService.fetchData<APIResponseVMSNotifications>({
    url: `/vms/vms/${vmsId}/notifications`,
    method: 'GET',
    params,
  })
}

// GET STATUS (composite health snapshot — operation/stream/box/last_setting)
export const getVMSStatusAPI = async (vmsId: number | string) => {
  return ApiService.fetchData<VMSStatusResponse>({
    url: `/vms/vms/${vmsId}/status`,
    method: 'GET',
  })
}

// GET DETAILS (full solution detail — crossings/desktop_screen/camera/weather)
export const getVMSDetailsAPI = async (solutionId: number | string) => {
  return ApiService.fetchData<VMSDetails>({
    url: `/vms/details/${solutionId}`,
    method: 'GET',
  })
}

// GET SETTING TYPE
export const getVMSSettingTypeAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingType>({
    url: `/vms/settings/types`,
    method: 'GET',
  })
}

// POST SETTING TYPE
export const postVMSSettingTypeAPI = async (data: APIRequestPostVMSSettingType) => {
  return ApiService.fetchData<APIResponsePostVMSSettingType, APIRequestPostVMSSettingType>({
    url: '/vms/settings/types',
    method: 'POST',
    data: { ...data },
  })
}

// PUT SETTING TYPE
export const putVMSSettingTypeAPI = async (id: string | number, data: APIRequestPutVMSSettingType) => {
  return ApiService.fetchData<APIResponsePutVMSSettingType, APIRequestPutVMSSettingType>({
    url: `/vms/settings/types/${id}`,
    method: 'PUT',
    data: { ...data },
  })
}

// DELETE SETTING TYPE
export const deleteVMSSettingTypeAPI = async (id: string | number) => {
  return ApiService.fetchData<APIResponseDeleteVMSSettingType>({
    url: `/vms/settings/types/${id}`,
    method: 'DELETE',
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
  return ApiService.fetchData<APIResponseVMSScheduleByDate, APIRequestVMSSettingSchedule>({
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

// SETTING BY STATUS
export const getVMSSettingByStatusAPI = async (params: APIRequestVMSSettingByStatus) => {
  return ApiService.fetchData<APIResponseVMSSettingByStatus, APIRequestVMSSettingByStatus>({
    url: `/vms/settings/by-status`,
    method: 'GET',
    params: { ...params }
  })
}

// BATCH DELETE
export const postVMSMediaBatchDeleteAPI = async (data: APIRequestPostVMSBatchDelete) => {
  return ApiService.fetchData<APIResponsePostVMSBatchDelete, APIRequestPostVMSBatchDelete>({
    url: '/vms/settings/schedules/batch-delete',
    method: 'POST',
    data: { ...data },
  })
}

// STATUS COUNT
export const getVMSSettingStatusCountAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingStatusCount>({
    url: `/vms/settings/status-counts`,
    method: 'GET',
  })
}

// STATUS
export const getVMSSettingStatusAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingStatus>({
    url: `/vms/settings/statuses`,
    method: 'GET',
  })
}

// LATEST
export const getVMSSettingLatestAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingLatest>({
    url: `/vms/settings/latest`,
    method: 'GET',
  })
}

// BY VMS ID
// vms_ids is repeated as bare `vms_ids=1&vms_ids=2` (not `vms_ids[]=1&vms_ids[]=2`) —
// axios defaults array params to the `[]` suffix, so `indexes: null` is required to match this API.
export const getVMSSettingByVMSIDAPI = async (params: APIRequestVMSSettingByVMSID) => {
  return ApiService.fetchData<APIResponseVMSSettingByVMSID, APIRequestVMSSettingByVMSID>({
    url: `/vms/settings/by-vms-ids`,
    method: 'GET',
    params: { ...params },
    paramsSerializer: { indexes: null },
  })
}
