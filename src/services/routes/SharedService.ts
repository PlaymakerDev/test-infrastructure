import { APIResponseCCTVDetail, APIResponseCCTVRoad } from "@/types/cctv/shared-api"
import ApiService from "../ApiService"
import {
  APIRequestDepartmentByRoad,
  APIRequestRoad,
  APIRequestRoadList,
  APIRequestSideMenuRoad,
  APIResponseContactDetail,
  APIResponseDepartmentByRoad,
  APIResponseProjectDetail,
  APIResponseRoad,
  APIResponseRoadList,
  APIResponseSideMenuRoad,
  UploadResponse,
} from "@/types/shared"

export const getCCTVDetailAPI = async (cameraId: string | number) => {
  return ApiService.fetchData<APIResponseCCTVDetail>({
    url: `/cctv/cameras/${cameraId}`,
    method: 'GET',
  })
}

/** GET /cctv/{id} — distinct endpoint from getCCTVDetailAPI's /cctv/cameras/{id}. Carries road_code. */
export const getCCTVRoadAPI = async (cameraId: string | number) => {
  return ApiService.fetchData<APIResponseCCTVRoad>({
    url: `/cctv/${cameraId}`,
    method: 'GET',
  })
}

/** GET /manage/project/{id} — returns `[]` (not 404) when the id doesn't exist. */
export const getProjectAPI = async (projectId: number) => {
  return ApiService.fetchData<APIResponseProjectDetail | []>({
    url: `/manage/project/${projectId}`,
    method: 'GET',
  })
}

export const getContactDetailAPI = async (projectId: string | number) => {
  return ApiService.fetchData<APIResponseContactDetail>({
    url: `/manage/contract/${projectId}`,
    method: 'GET',
  })
}

export const getDepartmentByRoadAPI = async (params: APIRequestDepartmentByRoad) => {
  return ApiService.fetchData<APIResponseDepartmentByRoad, APIRequestDepartmentByRoad>({
    url: `/manage/departments/by-road`,
    method: 'GET',
    params: { ...params }
  })
}

export const postUploadVMSAPI = async (form: FormData, full_url?: boolean) =>
  ApiService.fetchData<UploadResponse, FormData>({
    url: '/upload/vms',
    method: 'POST',
    data: form,
    params: {
      full_url: full_url
    }
  })

export const getRoadListAPI = async (params: APIRequestRoadList) => {
  return ApiService.fetchData<APIResponseRoadList, APIRequestRoadList>({
    url: `/manage/roads`,
    method: 'GET',
    params: { is_exist: true, ...params }
  })
}

export const getRoadAPI = async (params: APIRequestRoad) => {
  return ApiService.fetchData<APIResponseRoad, APIRequestRoad>({
    url: `/manage/roads`,
    method: 'GET',
    params,
  })
}

export const getSideMenuRoadAPI = async (params: APIRequestSideMenuRoad) => {
  return ApiService.fetchData<APIResponseSideMenuRoad, APIRequestSideMenuRoad>({
    url: `/manage/departments/side_menu/roads`,
    method: 'GET',
    params,
  })
}