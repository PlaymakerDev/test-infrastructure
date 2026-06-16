import { APIResponseCCTVDetail } from "@/types/cctv/shared-api"
import ApiService from "../ApiService"

export const getCCTVDetailAPI = async (cameraId: string | number) => {
  return ApiService.fetchData<APIResponseCCTVDetail>({
    url: `/cctv/cameras/${cameraId}`,
    method: 'GET',
  })
}