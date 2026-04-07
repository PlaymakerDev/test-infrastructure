import ApiService from "../ApiService"
import { APIGetResponseExample } from "@/types/example"

export const getExampleAPI = async () => {
  return ApiService.fetchData<APIGetResponseExample>({
    url: '/auth/me',
    method: 'GET',
  })
}