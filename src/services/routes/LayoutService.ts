import ApiService from "../ApiService"
import { APIResponseSidebar } from "@/types/layout/api"

export const getSidebarAPI = async () => {
  return ApiService.fetchData<APIResponseSidebar>({
    url: '/manage/departments/central/side_menu',
    method: 'GET',
  })
}