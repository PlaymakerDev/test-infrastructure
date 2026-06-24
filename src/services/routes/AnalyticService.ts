import ApiService from '../ApiService'
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
  APIResponseIncidentDashboard,
  IncidentDashboardType,
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
  })

/** Stat-card totals (flat dept scope — matches /overview & /overview/list, 41). */
export const getIncidentTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseIncidentTotals>({
    url: `${analyticBase(deptId)}/overview/totals`,
    method: 'GET',
  })

/** Bureau-scoped totals — same shape, but counts match `/overview/central/list`
 *  (the table source). Use this for the overview chips/cards so the numbers
 *  agree with the table. */
export const getIncidentCentralTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseIncidentTotals>({
    url: `${analyticBase(deptId)}/overview/central/totals`,
    method: 'GET',
  })

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging. */
export const getIncidentCentralListAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseIncidentCentralList>({
    url: `${analyticBase(deptId)}/overview/central/list`,
    method: 'GET',
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
    params: { limit },
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

/** Hourly/daily/weekly/monthly bucketed counts. daily = 24 hourly buckets. */
export const getIncidentDashboardAPI = (
  deptId: string | number,
  type: IncidentDashboardType
) =>
  ApiService.fetchData<APIResponseIncidentDashboard>({
    url: `/analytic/details/${deptId}/dashboard`,
    method: 'GET',
    params: { type },
  })

// ── License ─────────────────────────────────────────────────────────────────

/** Camera license keys for ONE solution. `{id}` = solution_id. Not dept-scoped. */
export const getIncidentLicenseAPI = (solutionId: string | number) =>
  ApiService.fetchData<APIResponseIncidentLicense>({
    url: `/analytic/license/${solutionId}`,
    method: 'GET',
  })
