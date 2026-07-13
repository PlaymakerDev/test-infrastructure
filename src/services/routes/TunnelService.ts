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
  params: APIRequestTunnelOverview = {}
) =>
  ApiService.fetchData<APIResponseTunnelOverview>({
    url: TUNNEL_API_ENDPOINTS.overview(deptId),
    method: 'GET',
    params: {
      ...(params.solution_id ? { solution_id: params.solution_id } : {}),
      ...centralScope(deptId),
    },
  })

// Random online cameras for the left-rail CCTV preview list. Defaults to 3
// to match the design (3 stacked cards).
export const getTunnelRandomCamerasAPI = (
  deptId: string | number,
  params: APIRequestTunnelRandomCameras = {}
) =>
  ApiService.fetchData<APIResponseTunnelRandomCameras>({
    url: TUNNEL_API_ENDPOINTS.randomCameras(deptId),
    method: 'GET',
    params: { limit: params.limit ?? 3, ...centralScope(deptId) },
  })

// Aggregated counters for the right-rail InfoCards — solution + warranty totals.
export const getTunnelTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseTunnelTotals>({
    url: TUNNEL_API_ENDPOINTS.totals(deptId),
    method: 'GET',
    params: centralScope(deptId),
  })

// Bureau-aware nested list — `bureau → sub_department → solutions` with
// per-bureau project counts, driving the table's bureau header badge.
// Every optional param is forwarded only when set so the URL stays clean
// for the common "just paginate" case.
export const getTunnelCentralListAPI = (
  deptId: string | number,
  params: APIRequestTunnelCentralList = {}
) =>
  ApiService.fetchData<APIResponseTunnelCentralList>({
    url: TUNNEL_API_ENDPOINTS.centralList(deptId),
    method: 'GET',
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      ...(params.road_code ? { road_code: params.road_code } : {}),
      ...(params.contract_no ? { contract_no: params.contract_no } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.field ? { field: params.field } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      ...centralScope(deptId),
    },
  })
