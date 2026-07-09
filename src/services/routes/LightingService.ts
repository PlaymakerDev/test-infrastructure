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
  Logs4gRecord,
  PaginatedElectricityAgg,
} from "@/types/lighting"

// NOTE: Lighting service base path is `/lighting` (different from manage).
// `overview` requires a trailing slash; `central/list` does not — both verified
// against the live backend.

// --- Overview APIs (map geometry + list) ---

/** GET /lighting/departments/{id}/overview → { centroid, locations[] } */
export const getLightingOverviewAPI = async (deptId: number) => {
  return ApiService.fetchData<LightingOverviewResponse>({
    url: `/lighting/departments/${deptId}/overview/`,
    method: 'GET',
    params: centralScope(deptId),
  })
}

/** GET /lighting/departments/{id}/overview/central/list
 *  → bureau → sub-department → solutions[] (carries imei per Klanarong) */
export const getLightingCentralListAPI = async (deptId: number) => {
  return ApiService.fetchData<OverviewCentralItem[]>({
    url: `/lighting/departments/${deptId}/overview/central/list`,
    method: 'GET',
    params: centralScope(deptId),
  })
}

/** GET /lighting/departments/{id}/overview/central/totals
 *  → solution { total, online, offline } + warranty { active, expired } */
export const getLightingCentralTotalsAPI = async (deptId: number) => {
  return ApiService.fetchData<LightingOverviewTotals>({
    url: `/lighting/departments/${deptId}/overview/central/totals`,
    method: 'GET',
    params: centralScope(deptId),
  })
}

/** GET /lighting/departments/{id}/overview/random-online
 *  → one random online device detail (imei, phase, electricity, line_checks) */
export const getLightingRandomOnlineAPI = async (deptId: number) => {
  return ApiService.fetchData<DetailsResponse>({
    url: `/lighting/departments/${deptId}/overview/random-online`,
    method: 'GET',
    params: centralScope(deptId),
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

/** GET /lighting/logs4g/graph/volt?imei= → hourly voltage points (24h) */
export const getLightingVoltGraphAPI = async (imei: string) => {
  return ApiService.fetchData<Logs4gVoltPoint[]>({
    url: `/lighting/logs4g/graph/volt`,
    method: 'GET',
    params: { imei },
  })
}

/** GET /lighting/logs4g/graph/amp?imei= → hourly current points (24h) */
export const getLightingAmpGraphAPI = async (imei: string) => {
  return ApiService.fetchData<Logs4gAmpPoint[]>({
    url: `/lighting/logs4g/graph/amp`,
    method: 'GET',
    params: { imei },
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

/** GET /lighting/logs4g?imei= → raw IoT log records for today.
 *  NOTE: the backend `date` param returns 0 rows for every format we tried,
 *  so we omit it and always get today's data. */
export const getLightingLogs4gAPI = async (imei: string) => {
  return ApiService.fetchData<Logs4gRecord[]>({
    url: `/lighting/logs4g`,
    method: 'GET',
    params: { imei },
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

