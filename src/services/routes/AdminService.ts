import { AuthInfo } from "@/types/auth"
import ApiService from "../ApiService"
import { APIGetResponseAdmin } from "@/types/admin"

export const getAdminAPI = async () => {
  return ApiService.fetchData<APIGetResponseAdmin>({
    url: '/auth/me',
    method: 'GET',
  })
}

export const getAuthInfoAPI = async () => {
  return ApiService.fetchData<AuthInfo>({
    url: '/manage/info',
    method: 'GET',
  })
}