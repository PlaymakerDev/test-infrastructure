import ApiService from "../ApiService"
import { APIGetResponseAdmin } from "@/types/admin"

export const getAdminAPI = async () => {
  return ApiService.fetchData<APIGetResponseAdmin>({
    url: '/auth/me',
    method: 'GET',
  })
}
