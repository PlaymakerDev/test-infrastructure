import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIRequestCCTVOverviewList,
  APIResponseCCTVOverview,
  APIResponseCCTVOverviewList,
  APIRequestCCTVOverviewDropdowns,
  APIResponseCCTVOverviewDropdowns,
  APIResponseCCTVOverviewCentralList,
  APIResponseCCTVOverviewCentralTotals,
} from '@/types/cctv/overview-api'
import type {
  APIRequestCCTVCameras,
  APIResponseCCTVCameras,
  APIRequestCCTVCameraList,
  APIResponseCCTVCameraList,
  APIRequestCCTVCameraTotals,
  APIResponseCCTVCameraTotals,
  APIRequestCCTVCameraDropdowns,
  APIResponseCCTVCameraDropdowns,
  APIResponseCCTVRandomOnline,
  APIRequestCCTVUptime,
  APIResponseCCTVUptimeStatistics,
  APIResponseCCTVCameraCentralList,
} from '@/types/cctv/camera-api'

// URL prefix helper — keeps `/cctv/departments/{deptId}` DRY.
const cctvDeptBase = (deptId: string | number) => `/cctv/departments/${deptId}`

// ── Overview (solution/route-level) ─────────────────────────────────────────────

/** Map markers (one per solution) + centroid. */
export const getCctvOverviewAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseCCTVOverview>({
    url: `${cctvDeptBase(deptId)}/overview`,
    method: 'GET',
    params: centralScope(deptId),
  })

export const getCctvOverviewListAPI = (
  deptId: string | number,
  params: APIRequestCCTVOverviewList = {}
) =>
  ApiService.fetchData<APIResponseCCTVOverviewList>({
    url: `${cctvDeptBase(deptId)}/overview/list`,
    method: 'GET',
    params,
  })

export const getCctvOverviewDropdownsAPI = (
  deptId: string | number,
  params: APIRequestCCTVOverviewDropdowns = {}
) =>
  ApiService.fetchData<APIResponseCCTVOverviewDropdowns>({
    url: `${cctvDeptBase(deptId)}/overview/dropdowns`,
    method: 'GET',
    params,
  })

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging. */
export const getCctvOverviewCentralListAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseCCTVOverviewCentralList>({
    url: `${cctvDeptBase(deptId)}/overview/central/list`,
    method: 'GET',
    params: centralScope(deptId),
  })

export const getCctvOverviewCentralTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseCCTVOverviewCentralTotals>({
    url: `${cctvDeptBase(deptId)}/overview/central/totals`,
    method: 'GET',
    params: centralScope(deptId),
  })

// ── Camera-level ────────────────────────────────────────────────────────────────

/** Map markers (one per camera) + centroid. */
export const getCctvCamerasAPI = (
  deptId: string | number,
  params: APIRequestCCTVCameras = {}
) =>
  ApiService.fetchData<APIResponseCCTVCameras>({
    url: `${cctvDeptBase(deptId)}/cameras`,
    method: 'GET',
    params,
  })

export const getCctvCameraListAPI = (
  deptId: string | number,
  params: APIRequestCCTVCameraList = {}
) =>
  ApiService.fetchData<APIResponseCCTVCameraList>({
    url: `${cctvDeptBase(deptId)}/cameras/list`,
    method: 'GET',
    params,
  })

export const getCctvCameraTotalsAPI = (
  deptId: string | number,
  params: APIRequestCCTVCameraTotals = {}
) =>
  ApiService.fetchData<APIResponseCCTVCameraTotals>({
    url: `${cctvDeptBase(deptId)}/cameras/totals`,
    method: 'GET',
    params,
  })

export const getCctvCameraDropdownsAPI = (
  deptId: string | number,
  params: APIRequestCCTVCameraDropdowns = {}
) =>
  ApiService.fetchData<APIResponseCCTVCameraDropdowns>({
    url: `${cctvDeptBase(deptId)}/cameras/dropdowns`,
    method: 'GET',
    params,
  })

export const getCctvRandomOnlineAPI = (
  deptId: string | number,
  limit: number
) =>
  ApiService.fetchData<APIResponseCCTVRandomOnline>({
    url: `${cctvDeptBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: { limit, ...centralScope(deptId) },
  })

export const getCctvUptimeStatisticsAPI = (
  deptId: string | number,
  params: APIRequestCCTVUptime = {}
) =>
  ApiService.fetchData<APIResponseCCTVUptimeStatistics>({
    url: `${cctvDeptBase(deptId)}/cameras/uptime-statistics`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })

/** Cameras for ONE road, grouped by project/solution_location/solution.
 *  Powers the CCTV search page. Not department-scoped — keyed by `road_id`. */
export const getCctvCameraCentralListAPI = (roadId: string | number) =>
  ApiService.fetchData<APIResponseCCTVCameraCentralList>({
    url: `/cctv/cameras/central/list`,
    method: 'GET',
    params: { road_id: roadId },
  })
