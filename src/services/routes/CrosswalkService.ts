import ApiService from '../ApiService'
import type {
  APIRequestCrosswalkCentralList,
  APIResponseCrosswalkCentralList,
  APIRequestCrosswalkOverview,
  APIResponseCrosswalkOverview,
  APIRequestCrosswalkRandomCameras,
  APIResponseCrosswalkRandomCameras,
  APIResponseCrosswalkTotals,
} from '@/types/crosswalk/overview-api'
import type {
  APIRequestCrosswalkCameras,
  APIResponseCrosswalkCameras,
  APIResponseCrosswalkSolutionDetail,
  APIRequestCrosswalkSummaryDaily,
  APIResponseCrosswalkSummaryDaily,
  APIRequestCrosswalkGraph,
  APIResponseCrosswalkGraph,
  APIRequestCrosswalkViolationList,
  APIResponseCrosswalkViolationList,
} from '@/types/crosswalk/detail-api'

const crosswalkDeptBase = (deptId: string | number) =>
  `/crosswalk/departments/${deptId}`

// ── Overall page ──────────────────────────────────────────────────────────────

// Map markers + centroid for the overall page map. `solution_id` narrows the
// response to a single solution when set (deep-link style).
export const getCrosswalkOverviewAPI = (
  deptId: string | number,
  params: APIRequestCrosswalkOverview = {}
) =>
  ApiService.fetchData<APIResponseCrosswalkOverview>({
    url: `${crosswalkDeptBase(deptId)}/overview`,
    method: 'GET',
    params: params.solution_id ? { solution_id: params.solution_id } : undefined,
  })

// Random online cameras for the left-rail CCTV preview list. Defaults to 3
// to match the design (3 stacked cards).
export const getCrosswalkRandomCamerasAPI = (
  deptId: string | number,
  params: APIRequestCrosswalkRandomCameras = {}
) =>
  ApiService.fetchData<APIResponseCrosswalkRandomCameras>({
    url: `${crosswalkDeptBase(deptId)}/cameras/random-online`,
    method: 'GET',
    params: { limit: params.limit ?? 3 },
  })

// Aggregated counters for the right-rail InfoCards — solution + warranty totals.
export const getCrosswalkTotalsAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseCrosswalkTotals>({
    url: `${crosswalkDeptBase(deptId)}/overview/central/totals`,
    method: 'GET',
  })

// ── Detail page ───────────────────────────────────────────────────────────────

// Solution-level admin metadata — shared `/manage` namespace endpoint, also
// used by traffic-volume and traffic-signal. Drives the AnyDesk button on the
// detail title bar.
export const getCrosswalkSolutionDetailAPI = (id: string | number) =>
  ApiService.fetchData<APIResponseCrosswalkSolutionDetail>({
    url: `/manage/solution/details/${id}`,
    method: 'GET',
  })

// Daily summary for the detail page's InfoCard rail. Note the URL puts
// `solution_id` in the path (not query string). `start_date` / `end_date`
// are forwarded only when set so the backend can default to today. When
// only `start_date` is passed the response is for that single day; when
// both are set, the backend aggregates across the range.
export const getCrosswalkSummaryDailyAPI = (
  params: APIRequestCrosswalkSummaryDaily
) =>
  ApiService.fetchData<APIResponseCrosswalkSummaryDaily>({
    url: `/crosswalk/solutions/${params.solution_id}/details`,
    method: 'GET',
    params: {
      ...(params.start_date ? { start_date: params.start_date } : {}),
      ...(params.end_date ? { end_date: params.end_date } : {}),
    },
  })

// Hourly time-series for the two detail-page charts (crossing + violation).
export const getCrosswalkGraphAPI = (params: APIRequestCrosswalkGraph) =>
  ApiService.fetchData<APIResponseCrosswalkGraph>({
    url: `/crosswalk/solutions/${params.solution_id}/details/graph`,
    method: 'GET',
    params: params.start_date ? { start_date: params.start_date } : undefined,
  })

// Paginated violation events for the ViolationSection table. Optional filters
// (crossing_type / search / field+sort) forwarded only when set so the URL
// stays clean for the common "no filter" case.
export const getCrosswalkViolationListAPI = (
  params: APIRequestCrosswalkViolationList
) =>
  ApiService.fetchData<APIResponseCrosswalkViolationList>({
    url: `/crosswalk/solutions/${params.solution_id}/details/list`,
    method: 'GET',
    params: {
      ...(params.start_date ? { start_date: params.start_date } : {}),
      ...(params.end_date ? { end_date: params.end_date } : {}),
      ...(params.crossing_type != null ? { crossing_type: params.crossing_type } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.field ? { field: params.field } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  })

// Per-solution camera list — drives the detail page's camera table + grid.
// `solution_id` is forwarded only when set so the URL stays clean when
// fetching all cameras for the department.
export const getCrosswalkCamerasAPI = (
  deptId: string | number,
  params: APIRequestCrosswalkCameras = {}
) =>
  ApiService.fetchData<APIResponseCrosswalkCameras>({
    url: `${crosswalkDeptBase(deptId)}/cameras`,
    method: 'GET',
    params: params.solution_id ? { solution_id: params.solution_id } : undefined,
  })

// ── Overall page (continued) ──────────────────────────────────────────────────

// Bureau-aware list — returns nested bureau → sub-dept → solutions tree.
// Mirrors `/counting/...` central-list shape; only `camera.online_count` /
// `camera.offline_count` (and the extra `crosswalk` field) differ.
export const getCrosswalkCentralListAPI = (
  deptId: string | number,
  params: APIRequestCrosswalkCentralList = {}
) =>
  ApiService.fetchData<APIResponseCrosswalkCentralList>({
    url: `${crosswalkDeptBase(deptId)}/overview/central/list`,
    method: 'GET',
    params,
  })
