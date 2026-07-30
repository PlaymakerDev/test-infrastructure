import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIRequestTrafficVolumeCentralList,
  APIResponseTrafficVolumeCentralList,
  APIRequestTrafficVolumeOverview,
  APIResponseTrafficVolumeOverview,
  APIRequestTrafficVolumeRandomCameras,
  APIResponseTrafficVolumeRandomCameras,
  APIResponseTrafficVolumeTotals,
  APIRequestTrafficVolumeTotals,
} from '@/types/traffic-volume/overview-api'
import type {
  APIRequestTrafficVolumeCameras,
  APIResponseTrafficVolumeCameras,
  APIRequestTrafficVolumeCamerasList,
  APIResponseTrafficVolumeCamerasList,
  APIRequestTrafficVolumeCountHour,
  APIResponseTrafficVolumeCountHour,
  APIRequestTrafficVolumeCountPrevious,
  APIResponseTrafficVolumeCountPrevious,
  APIRequestTrafficVolumeSummaryDaily,
  APIResponseTrafficVolumeSummaryDaily,
  APIResponseTrafficVolumeSolutionDetail,
  APIRequestTrafficVolumeAnalyticSummary,
  APIResponseTrafficVolumeAnalyticSummary,
  APIRequestTrafficVolumeSpeedPercentile,
  APIResponseTrafficVolumeSpeedPercentile,
  APIRequestTrafficVolumeAnalyticGraph,
  APIResponseTrafficVolumeAnalyticGraph,
  APIRequestTrafficVolumeReportSummary,
  APIResponseTrafficVolumeReportSummary,
} from '@/types/traffic-volume/detail-api'
import type { APIResponseTrafficVolumeLicense } from '@/types/traffic-volume/license-api'

const countingDeptBase = (deptId: string | number) =>
  `/counting/departments/${deptId}`

// ── Overall page ──────────────────────────────────────────────────────────────

// Map markers + centroid for the overall page map. `solution_id` narrows the
// response to a single solution when set (deep-link style).
export const getTrafficVolumeOverviewAPI = (
  deptId: string | number,
  params: APIRequestTrafficVolumeOverview
) =>
  ApiService.fetchData<APIResponseTrafficVolumeOverview, APIRequestTrafficVolumeOverview>({
    url: `${countingDeptBase(deptId)}/overview`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Bureau-aware list — returns nested bureau → sub-dept → solutions tree.
// Backend defaults are page=1, limit=100; both are forwarded only when set
// so the URL stays clean for the common "all rows" case.
export const getTrafficVolumeCentralListAPI = (
  deptId: string | number,
  params: APIRequestTrafficVolumeCentralList
) =>
  ApiService.fetchData<APIResponseTrafficVolumeCentralList, APIRequestTrafficVolumeCentralList>({
    url: `${countingDeptBase(deptId)}/overview/central/list`,
    method: 'GET',
    params: { ...params, ...centralScope(deptId) },
  })

// Random online cameras for the left-rail CCTV preview list. Defaults to 3
// to match the design (3 stacked cards).
export const getTrafficVolumeRandomCamerasAPI = (
  deptId: string | number,
  params: APIRequestTrafficVolumeRandomCameras
) =>
  ApiService.fetchData<APIResponseTrafficVolumeRandomCameras, APIRequestTrafficVolumeRandomCameras>({
    url: `${countingDeptBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Aggregated counters for the InfoCard right rail — camera + warranty totals.
// Uses central/totals (bureau-aware, matches the central/list table + honours
// scope=all at dept 0) so the cards agree with the list and the ส่วนกลาง view.
export const getTrafficVolumeTotalsAPI = (deptId: string | number, params: APIRequestTrafficVolumeTotals) =>
  ApiService.fetchData<APIResponseTrafficVolumeTotals, APIRequestTrafficVolumeTotals>({
    url: `${countingDeptBase(deptId)}/overview/central/totals`,
    method: 'GET',
    params: {
      ...params,
      ...centralScope(deptId),
    },
  })

// Camera license keys for ONE solution. `{id}` = solution_id. Not dept-scoped.
// Same shape as the analytic license endpoint — powers the License modal.
export const getTrafficVolumeLicenseAPI = (solutionId: string | number) =>
  ApiService.fetchData<APIResponseTrafficVolumeLicense>({
    url: `/counting/license/${solutionId}`,
    method: 'GET',
  })

// ── Detail page ───────────────────────────────────────────────────────────────

// Solution-level admin metadata — shared `/manage` namespace endpoint, also
// used by traffic-signal. Drives the AnyDesk button on the detail title bar.
export const getTrafficVolumeSolutionDetailAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseTrafficVolumeSolutionDetail>({
    url: `/manage/solution/details/${id}`,
    method: 'GET',
  })

// Daily analytic rollup — feeds the 4 stat cards on the วิเคราะห์ปริมาณจราจร
// tab. `date` defaults to today on the backend when omitted.
export const getTrafficVolumeAnalyticSummaryAPI = (
  params: APIRequestTrafficVolumeAnalyticSummary
) =>
  ApiService.fetchData<APIResponseTrafficVolumeAnalyticSummary>({
    url: `/counting/analytic/summary`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      ...(params.date ? { date: params.date } : {}),
    },
  })

// Cumulative speed-distribution curve — drives the 85th-percentile chart on
// the วิเคราะห์ปริมาณจราจร tab. `date` defaults to today when omitted.
export const getTrafficVolumeSpeedPercentileAPI = (
  params: APIRequestTrafficVolumeSpeedPercentile
) =>
  ApiService.fetchData<APIResponseTrafficVolumeSpeedPercentile>({
    url: `/counting/analytic/speed_percentile`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      ...(params.date ? { date: params.date } : {}),
    },
  })

// Hourly volume + 3h MA reference — drives the วิเคราะห์รูปแบบการจราจร
// chart on the วิเคราะห์ปริมาณจราจร tab. `date` defaults to today when omitted.
export const getTrafficVolumeAnalyticGraphAPI = (
  params: APIRequestTrafficVolumeAnalyticGraph
) =>
  ApiService.fetchData<APIResponseTrafficVolumeAnalyticGraph>({
    url: `/counting/analytic/graph`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      ...(params.date ? { date: params.date } : {}),
    },
  })

// Per-solution camera list — drives both the CCTV grid AND the detail map's
// per-camera markers. Backend returns `{ counting: [...], centroid: [...] }`.
export const getTrafficVolumeSolutionCamerasAPI = (
  deptId: string | number,
  params: APIRequestTrafficVolumeCameras = {}
) =>
  ApiService.fetchData<APIResponseTrafficVolumeCameras>({
    url: `${countingDeptBase(deptId)}/cameras`,
    method: 'GET',
    params: params.solution_id ? { solution_id: params.solution_id } : undefined,
  })

// Richer per-solution camera list — drives the CCTV grid + table on the
// detail page. Response envelope is `{ res_data: [...] }` and rows carry
// `ip_address` / `status.is_online` inline, so the UI does not need a
// per-camera follow-up fetch to render.
export const getTrafficVolumeSolutionCamerasListAPI = (
  deptId: string | number,
  params: APIRequestTrafficVolumeCamerasList = {}
) =>
  ApiService.fetchData<APIResponseTrafficVolumeCamerasList>({
    url: `${countingDeptBase(deptId)}/cameras/list`,
    method: 'GET',
    params: {
      ...(params.solution_id ? { solution_id: params.solution_id } : {}),
      page: params.page ?? 1,
      limit: params.limit ?? 100,
    },
  })

// Hourly counts + PCU breakdown — drives the hourly line chart. `date` is
// optional; backend defaults to today when omitted.
export const getTrafficVolumeCountHourAPI = (
  params: APIRequestTrafficVolumeCountHour
) =>
  ApiService.fetchData<APIResponseTrafficVolumeCountHour>({
    url: `/counting/details/count_hour`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      ...(params.date ? { date: params.date } : {}),
      ...(params.camera_id ? { camera_id: params.camera_id } : {}),
    },
  })

// Daily totals for the last N days — drives the 7-day comparison bar chart.
export const getTrafficVolumeCountPreviousAPI = (
  params: APIRequestTrafficVolumeCountPrevious
) =>
  ApiService.fetchData<APIResponseTrafficVolumeCountPrevious>({
    url: `/counting/details/count_previous`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      last: params.last ?? 7,
    },
  })

// Aggregated daily numbers (total_count / total_pcu / avg_speed / aadt / etc.)
// — drives the right-rail InfoCards on the detail page.
export const getTrafficVolumeSummaryDailyAPI = (
  params: APIRequestTrafficVolumeSummaryDaily
) =>
  ApiService.fetchData<APIResponseTrafficVolumeSummaryDaily>({
    url: `/counting/details/summary_daily`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      ...(params.date ? { date: params.date } : {}),
    },
  })

// Report-mode rollup (daily/hour/month/year/vehicle_type) — drives the
// รายงานการนับปริมาณจราจร tab tables. `camera_id` is forwarded only when set
// so the URL stays clean for the all-cameras case.
export const getTrafficVolumeReportSummaryAPI = (
  params: APIRequestTrafficVolumeReportSummary
) =>
  ApiService.fetchData<APIResponseTrafficVolumeReportSummary>({
    url: `/counting/reports/summary`,
    method: 'GET',
    params: {
      solution_id: params.solution_id,
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: params.report_type,
      ...(params.camera_id ? { camera_id: params.camera_id } : {}),
      ...(params.page !== undefined ? { page: params.page } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    },
  })
