import ApiService from "../ApiService"
import { centralScope } from "./scopeParam"
import type {
  OverviewCentralItem,
  LightingOverviewResponse,
  LightingOverviewTotals,
  DetailsResponse,
  Logs4gVoltPoint,
  Logs4gAmpPoint,
  PaginatedAlerts,
  PaginatedLogs4gCentral,
  PaginatedElectricityAgg,
  TopPowerRoadItem,
  LightingDiagram,
  APIRequestLightingCentralList,
} from "@/types/lighting"

// NOTE: Lighting service base path is `/lighting` (different from manage).
// `overview` requires a trailing slash; `central/list` does not — both verified
// against the live backend.

// --- Overview APIs (map geometry + list) ---

/** GET /lighting/departments/{id}/overview → { centroid, locations[] } */
export const getLightingOverviewAPI = async (deptId: number, params: APIRequestLightingCentralList = {}) => {
  return ApiService.fetchData<LightingOverviewResponse>({
    url: `/lighting/departments/${deptId}/overview/`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })
}

/** GET /lighting/departments/{id}/overview/central/list
 *  → bureau → sub-department → solutions[] (carries imei per Klanarong) */
export const getLightingCentralListAPI = async (deptId: number, params: APIRequestLightingCentralList = {}) => {
  return ApiService.fetchData<OverviewCentralItem[]>({
    url: `/lighting/departments/${deptId}/overview/central/list`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })
}

/** GET /lighting/departments/{id}/overview/central/totals
 *  → solution { total, online, offline } + warranty { active, expired } */
export const getLightingCentralTotalsAPI = async (deptId: number, params: APIRequestLightingCentralList = {}) => {
  return ApiService.fetchData<LightingOverviewTotals>({
    url: `/lighting/departments/${deptId}/overview/central/totals`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })
}

/** GET /lighting/departments/{id}/overview/random-online
 *  → one random online device detail (imei, phase, electricity, line_checks) */
export const getLightingRandomOnlineAPI = async (deptId: number, params: APIRequestLightingCentralList = {}) => {
  return ApiService.fetchData<DetailsResponse>({
    url: `/lighting/departments/${deptId}/overview/random-online`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })
}

/** GET /lighting/departments/{id}/overview/top-power-roads?start_date=&end_date=&limit=
 *  → roads ranked by total kW descending for the date range (both required).
 *  NOTE: despite the endpoint's camelCase error keys ("startDate"/"endDate"),
 *  the query params themselves must be snake_case — verified against the
 *  live backend (camelCase params 400s with "required"). */
export const getLightingTopPowerRoadsAPI = async (
  deptId: number,
  opts: { start_date: string; end_date: string; limit?: number },
) => {
  return ApiService.fetchData<TopPowerRoadItem[]>({
    url: `/lighting/departments/${deptId}/overview/top-power-roads`,
    method: 'GET',
    params: {
      start_date: opts.start_date,
      end_date: opts.end_date,
      ...(opts.limit ? { limit: opts.limit } : {}),
    },
  })
}

/** GET /lighting/diagrams/{imei} → circuit diagram data (components + wiring)
 *  behind the diagram iframe. Used to detect an empty/incomplete diagram
 *  (components: []) so the UI can show a placeholder instead of rendering
 *  a blank iframe. */
export const getLightingDiagramAPI = async (imei: string) => {
  return ApiService.fetchData<LightingDiagram>({
    url: `/lighting/diagrams/${imei}`,
    method: 'GET',
  })
}

/** GET /lighting/imei/{imei}/details
 *  → device detail (imei, phase, electricity[], line_checks, is_online, has_broken_wire) */
export const getLightingDeviceDetailsAPI = async (imei: string) => {
  return ApiService.fetchData<DetailsResponse>({
    url: `/lighting/imei/${imei}/details`,
    method: 'GET',
  })
}

/** GET /lighting/logs4g/graph/volt?imei=&phase_type= → hourly voltage points (24h) */
export const getLightingVoltGraphAPI = async (imei: string, phaseType?: number | null) => {
  return ApiService.fetchData<Logs4gVoltPoint[]>({
    url: `/lighting/logs4g/graph/volt`,
    method: 'GET',
    params: { imei, ...(phaseType ? { phase_type: phaseType } : {}) },
  })
}

/** GET /lighting/logs4g/graph/amp?imei=&phase_type= → hourly current points (24h) */
export const getLightingAmpGraphAPI = async (imei: string, phaseType?: number | null) => {
  return ApiService.fetchData<Logs4gAmpPoint[]>({
    url: `/lighting/logs4g/graph/amp`,
    method: 'GET',
    params: { imei, ...(phaseType ? { phase_type: phaseType } : {}) },
  })
}

/** GET /lighting/imei/{imei}/alerts → paginated alert logs for the device */
export const getLightingAlertsAPI = async (
  imei: string,
  opts?: { page?: number; limit?: number; sort?: 'ASC' | 'DESC' },
) => {
  return ApiService.fetchData<PaginatedAlerts>({
    url: `/lighting/imei/${imei}/alerts`,
    method: 'GET',
    params: { page: opts?.page ?? 1, limit: opts?.limit ?? 10, sort: opts?.sort ?? 'DESC' },
  })
}

/** GET /lighting/logs4g/central?imei=&start_date=&end_date=&data_type=&page=&limit=
 *  → paginated IoT log records across daily Mongo collections (Asia/Bangkok,
 *  inclusive range). Unlike the old /lighting/logs4g, `start_date`/`end_date`
 *  actually filter server-side. Both default to "today" when omitted. */
export const getLightingLogs4gCentralAPI = async (
  imei: string,
  opts?: {
    start_date?: string
    end_date?: string
    data_type?: 'circuit' | 'line_check' | 'volt_amp' | 'etc'
    page?: number
    limit?: number
  },
) => {
  return ApiService.fetchData<PaginatedLogs4gCentral>({
    url: `/lighting/logs4g/central`,
    method: 'GET',
    params: {
      imei,
      ...(opts?.start_date ? { start_date: opts.start_date } : {}),
      ...(opts?.end_date ? { end_date: opts.end_date } : {}),
      ...(opts?.data_type ? { data_type: opts.data_type } : {}),
      ...(opts?.page ? { page: opts.page } : {}),
      ...(opts?.limit ? { limit: opts.limit } : {}),
    },
  })
}

/** GET /lighting/imei/{imei}/electricity → aggregated electricity per period.
 *  `report_type` drives the bucket size (hourly|daily|monthly|yearly). */
export const getLightingElectricityAPI = async (
  imei: string,
  opts: {
    start_date?: string
    end_date?: string
    report_type?: 'hourly' | 'daily' | 'monthly' | 'yearly'
    limit?: number
    sort?: 'ASC' | 'DESC'
  },
) => {
  return ApiService.fetchData<PaginatedElectricityAgg>({
    url: `/lighting/imei/${imei}/electricity`,
    method: 'GET',
    params: {
      ...(opts.start_date ? { start_date: opts.start_date } : {}),
      ...(opts.end_date ? { end_date: opts.end_date } : {}),
      report_type: opts.report_type ?? 'daily',
      limit: opts.limit ?? 100,
      sort: opts.sort ?? 'ASC',
    },
  })
}

