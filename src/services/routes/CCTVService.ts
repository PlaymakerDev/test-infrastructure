import ApiService from '../ApiService'
import { CctvCameraEntry, CctvDeptCamerasResponse, CctvDeptOverview, CctvDeptOverviewListParams, CctvDeptOverviewListResponse, CctvDeptOverviewTotals, CctvRandomOnlineResponse, CctvStats } from '@/types/cctv'

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

export const getCctvDeptOverviewListAPI = async ({ deptId, page = 1, limit = 100 }: CctvDeptOverviewListParams) => {
  return ApiService.fetchData<CctvDeptOverviewListResponse>({
    url: `/cctv/departments/${deptId}/overview/list`,
    method: 'GET',
    params: { page, limit },
  })
}

export const getCctvDeptOverviewTotalsAPI = async (deptId: string) => {
  return ApiService.fetchData<CctvDeptOverviewTotals>({
    url: `/cctv/departments/${deptId}/overview/totals`,
    method: 'GET',
  })
}

export const getCctvDeptCamerasAPI = async (deptId: string, solutionId: string) => {
  return ApiService.fetchData<CctvDeptCamerasResponse>({
    url: `/cctv/departments/${deptId}/cameras`,
    method: 'GET',
    params: { solution_id: solutionId },
  })
}

export const getCctvRandomOnlineCamerasAPI = async (deptId: string, limit: number) => {
  return ApiService.fetchData<CctvRandomOnlineResponse>({
    url: `/cctv/departments/${deptId}/cameras/random-online`,
    method: 'GET',
    params: { limit },
  })
}
