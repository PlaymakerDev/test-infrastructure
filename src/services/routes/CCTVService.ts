import ApiService from '../ApiService'
import { CctvCameraEntry, CctvDeptOverview, CctvStats } from '@/types/cctv'

export const getCctvListAPI = async () => {
  return ApiService.fetchData<CctvCameraEntry[]>({
    url: '/admin/cctv/cameras',
    method: 'GET',
  })
}

export const getCctvStatsAPI = async () => {
  return ApiService.fetchData<CctvStats>({
    url: '/admin/cctv/stats',
    method: 'GET',
  })
}

export const getCctvDeptOverviewAPI = async (deptId: string) => {
  return ApiService.fetchData<CctvDeptOverview>({
    url: `/cctv/departments/${deptId}/overview`,
    method: 'GET',
  })
}
