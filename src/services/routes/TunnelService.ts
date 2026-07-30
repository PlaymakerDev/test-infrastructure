import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIRequestTunnelCentralList,
  APIResponseTunnelCentralList,
  APIRequestTunnelOverview,
  APIResponseTunnelOverview,
  APIRequestTunnelRandomCameras,
  APIResponseTunnelRandomCameras,
  APIResponseTunnelTotals,
  APIRequestTunnelTotals,
} from '@/types/tunnel/overview-api'

// Placeholder endpoints — swap to the real Tunnel API paths once available.
// Kept centralized here so the hooks and components never hardcode a URL.
export const TUNNEL_API_ENDPOINTS = {
  overview: (deptId: string | number) =>
    `/tunnel/departments/${deptId}/overview`,
  centralList: (deptId: string | number) =>
    `/tunnel/departments/${deptId}/overview/central/list`,
  totals: (deptId: string | number) =>
    `/tunnel/departments/${deptId}/overview/central/totals`,
  randomCameras: (deptId: string | number) =>
    `/tunnel/departments/${deptId}/cameras/random-online`,
} as const

// ── Overall page ──────────────────────────────────────────────────────────────

// Map markers + centroid for the overall page map. `solution_id` narrows the
// response to a single solution when set (deep-link style).
export const getTunnelOverviewAPI = (
  deptId: string | number,
  params: APIRequestTunnelOverview
) =>
  ApiService.fetchData<APIResponseTunnelOverview>({
    url: TUNNEL_API_ENDPOINTS.overview(deptId),
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Random online cameras for the left-rail CCTV preview list. Defaults to 3
// to match the design (3 stacked cards).
export const getTunnelRandomCamerasAPI = (
  deptId: string | number,
  params: APIRequestTunnelRandomCameras
) =>
  ApiService.fetchData<APIResponseTunnelRandomCameras, APIRequestTunnelRandomCameras>({
    url: TUNNEL_API_ENDPOINTS.randomCameras(deptId),
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Aggregated counters for the right-rail InfoCards — solution + warranty totals.
export const getTunnelTotalsAPI = (
  deptId: string | number,
  params: APIRequestTunnelTotals
) =>
  ApiService.fetchData<APIResponseTunnelTotals, APIRequestTunnelTotals>({
    url: TUNNEL_API_ENDPOINTS.totals(deptId),
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId)
    },
  })

// Bureau-aware nested list — `bureau → sub_department → solutions` with
// per-bureau project counts, driving the table's bureau header badge.
// Every optional param is forwarded only when set so the URL stays clean
// for the common "just paginate" case.
export const getTunnelCentralListAPI = (
  deptId: string | number,
  params: APIRequestTunnelCentralList
) =>
  ApiService.fetchData<APIResponseTunnelCentralList, APIRequestTunnelCentralList>({
    url: TUNNEL_API_ENDPOINTS.centralList(deptId),
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })
