import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIRequestTrafficOverview,
  APIResponseTrafficOverview,
  APIResponseTrafficTotals,
  APIRequestTrafficList,
  APIResponseTrafficList,
  APIResponseTrafficCentralList,
  APIRequestTrafficOverviewDropdowns,
  APIResponseTrafficOverviewDropdowns,
  APIRequestTrafficRandomCameras,
  APIResponseTrafficRandomCameras,
  APIRequestTrafficCameraList,
  APIResponseTrafficCameraList,
  APIResponseTrafficCameraCentralList,
  APIRequestTrafficCameraDropdowns,
  APIResponseTrafficCameraDropdowns,
  APIRequestTrafficTotals,
  APIRequestTrafficCentralList,
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
  params: APIRequestTrafficOverview
) =>
  ApiService.fetchData<APIResponseTrafficOverview, APIRequestTrafficOverview>({
    url: `${trafficDeptBase(deptId)}/overview`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Use the `/central/` variant — when the dept is a bureau (department_type=1)
// it aggregates totals across every sub-dept in the bureau's group, which is
// what the overall page needs. Falls back to the dept's own scope otherwise.
export const getTrafficTotalsAPI = (
  deptId: string | number,
  params: APIRequestTrafficTotals
) =>
  ApiService.fetchData<APIResponseTrafficTotals, APIRequestTrafficTotals>({
    url: `${trafficDeptBase(deptId)}/overview/central/totals`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
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

// Bureau-aware list — returns nested bureau → sub-dept → solutions and carries
// extra fields (`project.project_name`, per-solution camera online/offline
// counts) the flat `/list` endpoint omits.
export const getTrafficCentralListAPI = (
  deptId: string | number,
  params: APIRequestTrafficCentralList
) =>
  ApiService.fetchData<APIResponseTrafficCentralList, APIRequestTrafficCentralList>({
    url: `${trafficDeptBase(deptId)}/overview/central/list`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
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
  ApiService.fetchData<APIResponseTrafficRandomCameras, APIRequestTrafficRandomCameras>({
    url: `${trafficDeptBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
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

// Bureau-aware camera list — nested bureau → sub-dept → solutions[] with
// cameras + online/offline counts (and eventually `anydesk` per solution).
export const getTrafficCameraCentralListAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseTrafficCameraCentralList>({
    url: `${trafficDeptBase(deptId)}/cameras/central/list`,
    method: 'GET',
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
