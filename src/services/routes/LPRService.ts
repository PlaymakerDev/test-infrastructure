import ApiService from '../ApiService'
import type {
  APIRequestLPRPlates,
  APIResponseLPRPlates,
  APIResponseLPRPlateDetail,
  APIRequestLPRTimeline,
  APIResponseLPRTimeline,
  APIResponseLPRPoints,
} from '@/types/lpr/lpr-api'

// One row per CCTV solution that has LPR-active cameras — drives the LPR
// overall page's map + list. Returns raw array (no res_data wrapper). No
// dept scoping in backend; the FE filters by department_id when the URL
// carries dept_id.
export const getLPRPointsAPI = () =>
  ApiService.fetchData<APIResponseLPRPoints>({
    url: '/lpr/points',
    method: 'GET',
  })

// LPR read API — `/api-v2/lpr/*`, same host + admin JWT as the main backend,
// so BaseService injects auth automatically. See docs/lpr/API_DOCS.md.

// List of latest plates (deduped, captured_at DESC), cursor-paginated.
// `source` is forwarded only when narrowing (≠ 'all'); empty `q`/`cursor` are
// omitted to keep the URL clean for the common case.
export const getLPRPlatesAPI = (params: APIRequestLPRPlates = {}) =>
  ApiService.fetchData<APIResponseLPRPlates>({
    url: '/lpr/plates',
    method: 'GET',
    params: {
      ...(params.q ? { q: params.q } : {}),
      ...(params.source && params.source !== 'all' ? { source: params.source } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      limit: params.limit ?? 20,
    },
  })

// Single-plate detail (first_seen / latest / metadata / map_pins / frequent_areas).
// Path params carry Thai characters — must be URL-encoded.
export const getLPRPlateDetailAPI = (province: string, plateNumber: string) =>
  ApiService.fetchData<APIResponseLPRPlateDetail>({
    url: `/lpr/plates/${encodeURIComponent(province)}/${encodeURIComponent(plateNumber)}`,
    method: 'GET',
  })

// Timeline events for a plate, cursor-paginated (cursor NOT interchangeable
// with the /plates list cursor).
export const getLPRTimelineAPI = (
  province: string,
  plateNumber: string,
  params: APIRequestLPRTimeline = {}
) =>
  ApiService.fetchData<APIResponseLPRTimeline>({
    url: `/lpr/plates/${encodeURIComponent(province)}/${encodeURIComponent(plateNumber)}/timeline`,
    method: 'GET',
    params: {
      ...(params.cursor ? { cursor: params.cursor } : {}),
      limit: params.limit ?? 20,
    },
  })
