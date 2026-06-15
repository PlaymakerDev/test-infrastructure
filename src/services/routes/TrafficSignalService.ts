import ApiService from '../ApiService'
import type {
  APIRequestTrafficOverview,
  APIResponseTrafficOverview,
  APIResponseTrafficTotals,
  APIRequestTrafficList,
  APIResponseTrafficList,
  APIRequestTrafficOverviewDropdowns,
  APIResponseTrafficOverviewDropdowns,
  APIRequestTrafficRandomCameras,
  APIResponseTrafficRandomCameras,
  APIRequestTrafficCameraList,
  APIResponseTrafficCameraList,
  APIRequestTrafficCameraDropdowns,
  APIResponseTrafficCameraDropdowns,
} from '@/types/traffic-signal/overview-api'
import type {
  APIResponseTrafficContractInfo,
  APIResponseTrafficSolutionDetail,
  APIResponseTrafficDetails,
  APIResponseTrafficPhaseDetails,
  APIResponseTrafficSolutionCameras,
  APIResponseTrafficGraph,
  APIRequestTrafficSummary,
  APIResponseTrafficSummary,
  APIRequestTrafficReports,
  APIResponseTrafficReports,
} from '@/types/traffic-signal/detail-api'

// URL prefix helper — keeps `/traffic/departments/{deptId}` DRY.
const trafficDeptBase = (deptId: string | number) =>
  `/traffic/departments/${deptId}`

// ── Overall page (7 endpoints) ────────────────────────────────────────────────

export const getTrafficOverviewAPI = (
  deptId: string | number,
  params: APIRequestTrafficOverview = {}
) =>
  ApiService.fetchData<APIResponseTrafficOverview>({
    url: `${trafficDeptBase(deptId)}/overview`,
    method: 'GET',
    // Only forward solution_id when present — keeps the URL clean for the
    // "show all" case.
    params: params.solution_id ? { solution_id: params.solution_id } : undefined,
  })

export const getTrafficTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseTrafficTotals>({
    url: `${trafficDeptBase(deptId)}/overview/totals`,
    method: 'GET',
  })

export const getTrafficListAPI = (
  deptId: string | number,
  params: APIRequestTrafficList
) =>
  ApiService.fetchData<APIResponseTrafficList>({
    url: `${trafficDeptBase(deptId)}/overview/list`,
    method: 'GET',
    params,
  })

export const getTrafficOverviewDropdownsAPI = (
  deptId: string | number,
  params: APIRequestTrafficOverviewDropdowns
) =>
  ApiService.fetchData<APIResponseTrafficOverviewDropdowns>({
    url: `${trafficDeptBase(deptId)}/overview/dropdowns`,
    method: 'GET',
    params,
  })

export const getTrafficRandomCamerasAPI = (
  deptId: string | number,
  params: APIRequestTrafficRandomCameras
) =>
  ApiService.fetchData<APIResponseTrafficRandomCameras>({
    url: `${trafficDeptBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: { limit: params.limit ?? 4 },
  })

export const getTrafficCameraListAPI = (
  deptId: string | number,
  params: APIRequestTrafficCameraList
) =>
  ApiService.fetchData<APIResponseTrafficCameraList>({
    url: `${trafficDeptBase(deptId)}/cameras/list`,
    method: 'GET',
    params,
  })

export const getTrafficCameraDropdownsAPI = (
  deptId: string | number,
  params: APIRequestTrafficCameraDropdowns
) =>
  ApiService.fetchData<APIResponseTrafficCameraDropdowns>({
    url: `${trafficDeptBase(deptId)}/cameras/dropdowns`,
    method: 'GET',
    params,
  })

// ── Detail page (8 endpoints) ─────────────────────────────────────────────────

export const getTrafficContractInfoAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficContractInfo>({
    url: `/manage/contract/${id}`,
    method: 'GET',
  })

export const getTrafficSolutionDetailAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficSolutionDetail>({
    url: `/manage/solution/details/${id}`,
    method: 'GET',
  })

export const getTrafficDetailsAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficDetails>({
    url: `/traffic/details/${id}`,
    method: 'GET',
  })

export const getTrafficPhaseDetailsAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficPhaseDetails>({
    url: `/traffic/details/phase_details/${id}`,
    method: 'GET',
  })

export const getTrafficSolutionCamerasAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficSolutionCameras>({
    url: `/traffic/details/cameras/${id}`,
    method: 'GET',
  })

export const getTrafficGraphAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficGraph>({
    url: `/traffic/details/graph/${id}`,
    method: 'GET',
  })

export const getTrafficSummaryAPI = (
  id: string | number,
  params: APIRequestTrafficSummary
) =>
  ApiService.fetchData<APIResponseTrafficSummary>({
    url: `/traffic/details/summary/${id}`,
    method: 'GET',
    params,
  })

export const getTrafficReportsAPI = (
  id: string | number,
  params: APIRequestTrafficReports
) =>
  ApiService.fetchData<APIResponseTrafficReports>({
    url: `/traffic/details/reports/${id}`,
    method: 'GET',
    params,
  })
