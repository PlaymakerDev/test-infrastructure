import { APIRequestPostVMSBatchDelete, APIRequestVMSSettingByRoad, APIRequestVMSSettingByStatus, APIRequestVMSSettingByVMSID, APIRequestVMSSettingList, APIRequestVMSSettingSchedule, APIResponsePostVMSBatchDelete, APIResponseVMSMediaById, APIResponseVMSScheduleByDate, APIResponseVMSSettingByRoad, APIResponseVMSSettingByStatus, APIResponseVMSSettingByVMSID, APIResponseVMSSettingList, APIResponseVMSSettingStatus, APIResponseVMSSettingStatusCount, APIResponseVMSUpcomingSummary } from "@/types/control-vms/display-api"
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
  APIRequestVMSMediaUrl,
  APIResponseVMSMediaUrl,
  VMSStatusResponse,
  VMSDetails,
  APIResponseVMSNotifications
} from "@/types/control-vms/vms-api"
import { APIRequestVMSStatusHistory, APIResponseVMSStatusHistory } from "@/types/vms/history-api"
import { APIRequestVMSGlobalHistory, APIResponseVMSGlobalHistory, APIResponseVMSMonitor, APIResponseVMSSignDetail } from "@/types/vms/command-center-api"

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

// LATEST — the single most recently connected VMS sign (Statistics overview
// card's "ชุดคำสั่งล่าสุด"). No dedicated backend endpoint exists for this, so
// reuse the list endpoint sorted to the same effect instead of a made-up path.
export const getVMSSettingLatestAPI = async () => {
  return ApiService.fetchData<APIResponseVMSSettingList, APIRequestVMSSettingList>({
    url: `/vms/settings/list`,
    method: 'GET',
    params: { limit: 1, field: 'last_connected', sort: 'DESC' },
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

// VMS MEDIA URL
export const getVMSMediaUrlAPI = async (params: APIRequestVMSMediaUrl) => {
  return ApiService.fetchData<APIResponseVMSMediaUrl, APIRequestVMSMediaUrl>({
    url: `/vms/settings/media-urls`,
    method: 'GET',
    params: { ...params }
  })
}

// STATUS HISTORY — one setting's full timeline (newest first).
export const getVMSSettingStatusHistoryAPI = async (
  settingID: number,
  params: APIRequestVMSStatusHistory = {}
) => {
  return ApiService.fetchData<APIResponseVMSStatusHistory, APIRequestVMSStatusHistory>({
    url: `/vms/settings/media/${settingID}/history`,
    method: 'GET',
    params: { ...params },
  })
}

// STATUS HISTORY — one sign's full lifetime timeline (across every setting).
export const getVMSCrossingStatusHistoryAPI = async (
  crossingMasterIndex: string,
  params: APIRequestVMSStatusHistory = {}
) => {
  return ApiService.fetchData<APIResponseVMSStatusHistory, APIRequestVMSStatusHistory>({
    url: `/vms/crossings/${encodeURIComponent(crossingMasterIndex)}/history`,
    method: 'GET',
    params: { ...params },
  })
}

// CANCEL — stop-mid-way. Flips status→6 without deleting the setting/schedules.
export const cancelVMSSettingAPI = async (settingID: number) => {
  return ApiService.fetchData({
    url: `/vms/settings/media/${settingID}/cancel`,
    method: 'POST',
  })
}

// MONITOR — one row per vms_id with current setting + online/last_seen state.
// vms_ids is repeated (indexes:null) same as by-vms-ids.
export const getVMSCommandCenterMonitorAPI = async (vmsIds: number[]) => {
  return ApiService.fetchData<APIResponseVMSMonitor>({
    url: `/vms/command-center/monitor`,
    method: 'GET',
    params: { vms_ids: vmsIds },
    paramsSerializer: { indexes: null },
  })
}

// GLOBAL HISTORY — cross-sign command timeline (from/to YYYY-MM-DD optional).
export const getVMSCommandCenterHistoryAPI = async (params: APIRequestVMSGlobalHistory = {}) => {
  return ApiService.fetchData<APIResponseVMSGlobalHistory, APIRequestVMSGlobalHistory>({
    url: `/vms/command-center/history`,
    method: 'GET',
    params: { ...params },
  })
}

// SIGN DETAIL — full detail for fullscreen modal (current setting + schedules + cameras + live screen capture)
export const getVMSCommandCenterSignAPI = async (vmsId: number) => {
  return ApiService.fetchData<APIResponseVMSSignDetail>({
    url: `/vms/command-center/sign/${vmsId}`,
    method: 'GET',
  })
}