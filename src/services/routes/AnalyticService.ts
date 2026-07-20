import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIResponseIncidentOverview,
  APIResponseIncidentTotals,
  APIResponseIncidentCentralList,
  APIRequestIncidentList,
  APIResponseIncidentList,
} from '@/types/incident-detection/overview-api'
import type {
  APIRequestIncidentCameras,
  APIResponseIncidentCameras,
  APIResponseIncidentRandomOnline,
  APIRequestIncidentCameraList,
  APIResponseIncidentCameraList,
  APIRequestIncidentCameraTotals,
  APIResponseIncidentCameraTotals,
} from '@/types/incident-detection/camera-api'
import type { APIResponseIncidentLicense } from '@/types/incident-detection/license-api'
import type {
  APIRequestIncidentDaily,
  APIResponseIncidentDaily,
  APIRequestIncidentTransactions,
  APIResponseIncidentTransactions,
  APIResponseIncidentPeakHour,
} from '@/types/incident-detection/details-api'

// Incident Detection (เดิมชื่อ "Analytic") service. Backend namespace `/analytic`
// mirrors the CCTV department-scoped surface.
const analyticBase = (deptId: string | number) => `/analytic/departments/${deptId}`

// ── Overview (solution-level) ─────────────────────────────────────────────────

/** Map markers (one per solution) + centroid. */
export const getIncidentOverviewAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseIncidentOverview>({
    url: `${analyticBase(deptId)}/overview`,
    method: 'GET',
    params: centralScope(deptId),
  })

/** Bureau-scoped totals — same shape, but counts match `/overview/central/list`
 *  (the table source). Use this for the overview chips/cards so the numbers
 *  agree with the table. */
export const getIncidentCentralTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseIncidentTotals>({
    url: `${analyticBase(deptId)}/overview/central/totals`,
    method: 'GET',
    params: centralScope(deptId),
  })

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging. */
export const getIncidentCentralListAPI = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  ApiService.fetchData<APIResponseIncidentCentralList>({
    url: `${analyticBase(deptId)}/overview/central/list`,
    method: 'GET',
    params: {
      ...(params.scope ? { scope: params.scope } : centralScope(deptId)),
      start_date: params.start_date,
      end_date: params.end_date,
    },
  })

/** Flat paginated solution list (has offline_count directly). */
export const getIncidentListAPI = (
  deptId: string | number,
  params: APIRequestIncidentList = {}
) =>
  ApiService.fetchData<APIResponseIncidentList>({
    url: `${analyticBase(deptId)}/overview/list`,
    method: 'GET',
    params,
  })

// ── Camera-level ──────────────────────────────────────────────────────────────

/** Cameras for ONE solution (camera names + geometry). Powers the License modal.
 *  NOTE: the trailing slash is required — `/cameras` (no slash) 301-redirects. */
export const getIncidentCamerasAPI = (
  deptId: string | number,
  params: APIRequestIncidentCameras = {}
) =>
  ApiService.fetchData<APIResponseIncidentCameras>({
    url: `${analyticBase(deptId)}/cameras/`,
    method: 'GET',
    params,
  })

/** Random online cameras — overview left-rail live preview. */
export const getIncidentRandomOnlineAPI = (
  deptId: string | number,
  limit = 3
) =>
  ApiService.fetchData<APIResponseIncidentRandomOnline>({
    url: `${analyticBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: { limit, ...centralScope(deptId) },
  })

/** Paginated per-camera list for ONE solution — detail Tab1 table. */
export const getIncidentCameraListAPI = (
  deptId: string | number,
  params: APIRequestIncidentCameraList = {}
) =>
  ApiService.fetchData<APIResponseIncidentCameraList>({
    url: `${analyticBase(deptId)}/cameras/list`,
    method: 'GET',
    params,
  })

/** Camera online/offline counts (filterable by solution_id). */
export const getIncidentCameraTotalsAPI = (
  deptId: string | number,
  params: APIRequestIncidentCameraTotals = {}
) =>
  ApiService.fetchData<APIResponseIncidentCameraTotals>({
    url: `${analyticBase(deptId)}/cameras/totals`,
    method: 'GET',
    params,
  })

// ── Details (events) ────────────────────────────────────────────────────────

/** Daily event-type breakdown for one solution. Used by the trend line chart. */
export const getIncidentDailyAPI = (params: APIRequestIncidentDaily) =>
  ApiService.fetchData<APIResponseIncidentDaily>({
    url: `/analytic/details`,
    method: 'GET',
    params,
  })

/** Paginated event transactions for one solution + summary by type. Powers the
 *  event table, donut chart, and latest-events list. */
export const getIncidentTransactionsAPI = (params: APIRequestIncidentTransactions) =>
  ApiService.fetchData<APIResponseIncidentTransactions>({
    url: `/analytic/details/transactions`,
    method: 'GET',
    params,
  })

/** Peak event hour for ONE solution (today) + its share of the day's events. */
export const getIncidentPeakHourAPI = (solutionId: string | number) =>
  ApiService.fetchData<APIResponseIncidentPeakHour>({
    url: `/analytic/details/peak-hour`,
    method: 'GET',
    params: { solution_id: solutionId },
  })

// ── License ─────────────────────────────────────────────────────────────────

/** Camera license keys for ONE solution. `{id}` = solution_id. Not dept-scoped. */
export const getIncidentLicenseAPI = (solutionId: string | number) =>
  ApiService.fetchData<APIResponseIncidentLicense>({
    url: `/analytic/license/${solutionId}`,
    method: 'GET',
  })

// ── Incidents by Department (comparison table) ───────────────────────────────

/** GET /analytic/departments/{id}/overview/incidents-by-department
 *  Per-department incident counts broken down by type — powers the comparison
 *  table on /admin/statistics?incident&subtab=comparison. */
export const getIncidentByDepartmentAPI = (
  deptId: string | number,
  params: { start_date?: string; end_date?: string; scope?: string } = {},
) => {
  const { start_date, end_date, scope } = params
  return ApiService.fetchData<{
    summary: { departments_count: number; installation_points_count: number; incidents_count: number }
    range: { code: string; label: string; since: string; until: string }
    columns: { id: number; code: string; name_th: string }[]
    rows: {
      department_id: number
      department_short_name: string
      department_type: number
      department_group: number
      // true = roll-up total for this department AND all its descendants
      // (rendered as the bold parent row); false = this department's own
      // directly-attributed count (rendered as a child row, alongside its
      // real sub-departments — same department_id as the aggregate row
      // above it, since it's the parent counted "as itself").
      is_aggregate: boolean
      counts: number[]
      total: number
    }[]
    totals: { counts: number[]; total: number }
  }>({
    url: `${analyticBase(deptId)}/overview/incidents-by-department`,
    method: 'GET',
    params: {
      ...(scope ? { scope } : {}),
      ...(start_date ? { since: start_date } : {}),
      ...(end_date ? { until: end_date } : {}),
    },
  })
}

// ── Incidents Summary (stat cards) ───────────────────────────────────────────

/** GET /analytic/departments/{id}/overview/incidents-summary
 *  Aggregate counts powering the 4 stat cards on the incident overview.
 *  NOTE: request params are `start_date`/`end_date` (per the OpenAPI spec) —
 *  the response echoes the resolved window back as `range.since`/`range.until`,
 *  a DIFFERENT pair of names. Omitting both makes the backend default to today. */
export const getIncidentSummaryAPI = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  ApiService.fetchData<{
    range: { since: string; until: string }
    installation_points: {
      total: number
      top_region: { region_id: number; name_th: string; name_en: string; count: number; percentage: number }
    }
    incidents: {
      total: number
      top_department: { department_id: number; department_short_name: string; count: number; percentage: number }
      departments_with_incidents: number
    }
    top_incident_type: {
      id: number
      name_en: string
      name_th: string
      count: number
      percentage: number
    }
  }>({
    url: `${analyticBase(deptId)}/overview/incidents-summary`,
    method: 'GET',
    params,
  })

// ── IoT Status (alert overview search list) ──────────────────────────────────

export interface IotStatusDevice {
  imei: string
  solution_name: string
  sta: string
  is_online: boolean
  line_check_fail: boolean
  circuit_fail: boolean
  volt_amp_fail: boolean
  noti_count: number
  geometry_point: [number, number] | null
}

export interface IotStatusRoad {
  road_id: number
  road_code: string
  install_points: number
  online: number
  offline: number
  line_check_fail: number
  circuit_fail: number
  volt_amp_fail: number
  noti_count: number
  devices: IotStatusDevice[]
}

export interface IotStatusSubDept {
  department_id: number
  department_short_name: string
  install_points: number
  online: number
  offline: number
  line_check_fail: number
  circuit_fail: number
  volt_amp_fail: number
  noti_count: number
  roads: IotStatusRoad[]
}

export interface IotStatusBureau {
  department_id: number
  department_short_name: string
  install_points: number
  online: number
  offline: number
  line_check_fail: number
  circuit_fail: number
  volt_amp_fail: number
  noti_count: number
  sub_department: IotStatusSubDept[]
}

/** GET /lighting/departments/{id}/overview/central/iot-status?scope=all
 *  Bureau → sub_department → roads → devices IoT status tree.
 *  Powers the alert overview search list. */
export const getIotStatusAPI = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  ApiService.fetchData<IotStatusBureau[]>({
    url: `/lighting/departments/${deptId}/overview/central/iot-status`,
    method: 'GET',
    params,
  })

export interface IotStatusSummary {
  range: { since: string; until: string }
  installation_points: { total: number; phase_1: number; phase_3: number }
  line_broken: {
    total: number
    top_department: { department_id: number; department_short_name: string; count: number; percentage: number }
  }
  circuit_abnormal: {
    total: number
    top_department: { department_id: number; department_short_name: string; count: number; percentage: number }
  }
  normal: { total: number; percentage: number }
  notifications: { total: number }
}

/** GET /lighting/departments/{id}/overview/central/iot-status/summary?scope=all
 *  Aggregate counts powering the 4 stat cards on the alert overview. */
export const getIotStatusSummaryAPI = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  ApiService.fetchData<IotStatusSummary>({
    url: `/lighting/departments/${deptId}/overview/central/iot-status/summary`,
    method: 'GET',
    params,
  })
