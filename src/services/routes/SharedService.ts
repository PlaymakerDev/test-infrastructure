import { APIResponseCCTVDetail } from "@/types/cctv/shared-api"
import ApiService from "../ApiService"
import { APIRequestDepartmentByRoad, APIResponseContactDetail, APIResponseDepartmentByRoad, UploadResponse } from "@/types/shared"

export const getCCTVDetailAPI = async (cameraId: string | number) => {
  return ApiService.fetchData<APIResponseCCTVDetail>({
    url: `/cctv/cameras/${cameraId}`,
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

export const postUploadVMSAPI = async (form: FormData) =>
  ApiService.fetchData<UploadResponse, FormData>({
    url: '/upload/vms',
    method: 'POST',
    data: form,
  })
