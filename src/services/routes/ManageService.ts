// Settings page — CRUD wrappers for the /api-v2/manage/* namespace.
// Mirrors the shape of TrafficVolumeService.ts: standalone exported functions,
// each returning `ApiService.fetchData<T>({url, method, data, params})`.
//
// Notes on response shapes (see src/types/manage/*):
//   • List endpoints (/project, /contractor, /general_user, /roads) are wrapped
//     in `{ res_data: T[] }`.
//   • Plain-array endpoints (/project/budget_year, /project/contractor,
//     /departments, /regions) return bare arrays — no envelope.
//   • The single-item GET /project/{id} returns the bare object.

import ApiService from '../ApiService'
import type { ListParams, RoadListParams } from '@/types/manage/params'
import type { APIResponseProvinceList } from '@/types/manage/place-api'
import type {
  APIResponseSSOUser,
  APIRequestSSOSearch,
} from '@/types/manage/sso-search-api'
import type {
  APIResponseProject,
  APIResponseProjectListEnvelope,
  APIResponseProjectByCase,
  APIResponseBudgetYearList,
  APIRequestProject,
  APIRequestProjectUpdate,
} from '@/types/manage/project-api'
import type {
  APIResponseContractor,
  APIResponseContractorListEnvelope,
  APIRequestRegisterContractor,
  APIRequestUpdateContractor,
} from '@/types/manage/contractor-api'
import type {
  APIResponseGeneralUserListEnvelope,
  APIRequestRegisterGeneralUser,
  APIRequestUpdateGeneralUser,
  APIRequestUpdateGeneralUserPassword,
} from '@/types/manage/general-user-api'
import type {
  APIResponseRoadListEnvelope,
  APIRequestRoad,
} from '@/types/manage/road-api'
import type {
  APIResponseDepartmentList,
  APIResponseRegionList,
} from '@/types/manage/department-api'
import {
  APIRequestMarkCameraOutageRead,
  APIResponseCameraOutageList,
  APIResponseMarkCameraOutageRead,
  APIResponseNotificationSummary,
  CameraOutageListParams,
} from '@/types/manage/notification-api'

// Normalize `{ page, limit, search }` into a query-string object, dropping
// keys whose value is undefined / null / empty-string. Mirrors the
// TrafficVolumeService.ts idiom (`params.solution_id ? {…} : undefined`) so
// URLs stay clean for the common "all rows" case.
const toListQuery = (params: ListParams = {}) => {
  const q: Record<string, number | string> = {}
  if (params.page !== undefined) q.page = params.page
  if (params.limit !== undefined) q.limit = params.limit
  if (params.search !== undefined && params.search !== '')
    q.search = params.search
  return Object.keys(q).length > 0 ? q : undefined
}

// ── Projects ─────────────────────────────────────────────────────────────────

export const getProjectsAPI = (params: ListParams = {}) =>
  ApiService.fetchData<APIResponseProjectListEnvelope>({
    url: '/manage/project',
    method: 'GET',
    params: toListQuery(params),
  })

export const getProjectByIdAPI = (id: number) =>
  ApiService.fetchData<APIResponseProject>({
    url: `/manage/project/${id}`,
    method: 'GET',
  })

/** Resolves a maintenance/repair case number to its parent project — powers
 *  the "ข้อมูลโครงการ" card (contractor, contract_no, warranty dates) on the
 *  repair-history case modal. Same bare-object shape as GET /project/{id}. */
export const getProjectByCaseNoAPI = (caseNo: string) =>
  ApiService.fetchData<APIResponseProjectByCase>({
    url: `/manage/project/case/${caseNo}`,
    method: 'GET',
  })

export const createProjectAPI = (body: APIRequestProject) =>
  ApiService.fetchData<APIResponseProject, APIRequestProject>({
    url: '/manage/project',
    method: 'POST',
    data: body,
  })

/** Backend PUT reads the target id from the `project_id` query string
 *  (see manage/project_handler.go:PutProject), NOT the JSON body. Without
 *  this param the server returns 400 "project_id params is required". */
export const updateProjectAPI = (body: APIRequestProjectUpdate) => {
  const { id, ...rest } = body
  return ApiService.fetchData<APIResponseProject, Omit<APIRequestProjectUpdate, 'id'>>({
    url: '/manage/project',
    method: 'PUT',
    params: { project_id: id },
    data: rest,
  })
}

export const deleteProjectAPI = (id: number) =>
  ApiService.fetchData<void>({
    url: `/manage/project/${id}`,
    method: 'DELETE',
  })

/** Dropdown source for the budget-year filter — bare `number[]`. */
export const getProjectBudgetYearsAPI = () =>
  ApiService.fetchData<APIResponseBudgetYearList>({
    url: '/manage/project/budget_year',
    method: 'GET',
  })

/** Dropdown source for the contractor filter on the Project tab — bare
 *  `Contractor[]` (same shape as the /contractor list rows, no envelope). */
export const getProjectContractorsAPI = () =>
  ApiService.fetchData<APIResponseContractor[]>({
    url: '/manage/project/contractor',
    method: 'GET',
  })

// ── Contractors ──────────────────────────────────────────────────────────────

export const getContractorsAPI = (params: ListParams = {}) =>
  ApiService.fetchData<APIResponseContractorListEnvelope>({
    url: '/manage/contractor',
    method: 'GET',
    params: toListQuery(params),
  })

export const createContractorAPI = (body: APIRequestRegisterContractor) =>
  ApiService.fetchData<APIResponseContractor, APIRequestRegisterContractor>({
    url: '/manage/contractor',
    method: 'POST',
    data: body,
  })

/** Path id is the contractor's `user_id` (uuid). */
export const updateContractorAPI = (
  id: string,
  body: APIRequestUpdateContractor
) =>
  ApiService.fetchData<APIResponseContractor, APIRequestUpdateContractor>({
    url: `/manage/contractor/${id}`,
    method: 'PUT',
    data: body,
  })

export const deleteContractorAPI = (id: string) =>
  ApiService.fetchData<void>({
    url: `/manage/contractor/${id}`,
    method: 'DELETE',
  })

// ── Roads ────────────────────────────────────────────────────────────────────

// province = contains-match on the Thai name; department_id = exact match.
// Both verified server-side 2026-08-13 (see RoadListParams).
export const getRoadsAPI = (params: RoadListParams = {}) =>
  ApiService.fetchData<APIResponseRoadListEnvelope>({
    url: '/manage/roads',
    method: 'GET',
    params: {
      ...(toListQuery(params) ?? {}),
      ...(params.province ? { province: params.province } : {}),
      ...(params.department_id != null ? { department_id: params.department_id } : {}),
    },
  })

export const createRoadAPI = (body: APIRequestRoad) =>
  ApiService.fetchData<void, APIRequestRoad>({
    url: '/manage/roads',
    method: 'POST',
    data: body,
  })

export const updateRoadAPI = (id: number, body: APIRequestRoad) =>
  ApiService.fetchData<void, APIRequestRoad>({
    url: `/manage/roads/${id}`,
    method: 'PUT',
    data: body,
  })

export const deleteRoadAPI = (id: number) =>
  ApiService.fetchData<void>({
    url: `/manage/roads/${id}`,
    method: 'DELETE',
  })

// ── General users ────────────────────────────────────────────────────────────

// NOTE: /general_user ?search=… returns malformed JSON (backend bug — see
// task #12). Callers MUST NOT forward `search` through this function; the
// useUsersList hook filters this list client-side over the ~6-row dataset.
export const getGeneralUsersAPI = (params: ListParams = {}) =>
  ApiService.fetchData<APIResponseGeneralUserListEnvelope>({
    url: '/manage/general_user',
    method: 'GET',
    params: toListQuery(params),
  })

export const createGeneralUserAPI = (body: APIRequestRegisterGeneralUser) =>
  ApiService.fetchData<void, APIRequestRegisterGeneralUser>({
    url: '/manage/general_user',
    method: 'POST',
    data: body,
  })

/** Path id is the user's `user_id` (uuid). */
export const updateGeneralUserAPI = (
  id: string,
  body: APIRequestUpdateGeneralUser
) =>
  ApiService.fetchData<void, APIRequestUpdateGeneralUser>({
    url: `/manage/general_user/${id}`,
    method: 'PUT',
    data: body,
  })

export const deleteGeneralUserAPI = (id: string) =>
  ApiService.fetchData<void>({
    url: `/manage/general_user/${id}`,
    method: 'DELETE',
  })

/** PATCH — the admin-reset-password endpoint. Body is `{ password }`. */
export const updateGeneralUserPasswordAPI = (
  id: string,
  body: APIRequestUpdateGeneralUserPassword
) =>
  ApiService.fetchData<void, APIRequestUpdateGeneralUserPassword>({
    url: `/manage/general_user/${id}/password`,
    method: 'PATCH',
    data: body,
  })

// ── Shared / dropdowns ───────────────────────────────────────────────────────
// Both are bare arrays — NOT wrapped in `res_data`.

export const getDepartmentsAPI = () =>
  ApiService.fetchData<APIResponseDepartmentList>({
    url: '/manage/departments',
    method: 'GET',
  })

/** Full 77-province master list (bare array) — backs the Route tab's
 *  จังหวัด dropdown. */
export const getProvincesAPI = () =>
  ApiService.fetchData<APIResponseProvinceList>({
    url: '/manage/th_places/provinces',
    method: 'GET',
  })

export const getRegionsAPI = () =>
  ApiService.fetchData<APIResponseRegionList>({
    url: '/manage/regions',
    method: 'GET',
  })

// ── Notifications summary ───────────────────────────────────────────────────
// GET /manage/notifications/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Aggregates tbl_notification_logs by source_type across the window. JWT
// dept scope is applied server-side — no `dept_id` param.
export interface APIResponseNotificationSummaryItem {
  source_type: 'lighting' | 'analytic' | 'vms_setting' | string
  count: number
  most_type: { id: number | null; name: string | null } | null
  most_count: number
  most_department: {
    department_id: number
    department_short_name: string
    count: number
  } | null
}

export const getNotificationSummaryAPI = (params: {
  start_date: string
  end_date: string
}) =>
  ApiService.fetchData<APIResponseNotificationSummaryItem[]>({
    url: '/manage/notifications/summary',
    method: 'GET',
    params,
  })

// ── SSO / LDAP search ───────────────────────────────────────────────────────
// Backend endpoint: GET /api-v2/auth/ldap?keyword=... — routes through the
// authentication service, which owns the SSO bearer token and the upstream
// URL. Returns a bare `APIResponseSSOUser[]` (no envelope). Uses the shared
// ApiService so the request participates in the x-api-key / access-token /
// refresh chain like every other /manage call.
export const searchSSOUsersAPI = (body: APIRequestSSOSearch) =>
  ApiService.fetchData<APIResponseSSOUser[]>({
    url: '/auth/ldap',
    method: 'GET',
    params: { keyword: body.keyword },
  }).then((r) => r.data)

// ── Notifications ────────────────────────────────────────────────────────────

/** GET /manage/notifications/summary?start_date=&end_date= → one row per
 *  source_type (lighting/analytic/vms_setting) with its most-frequent ref_type
 *  and most-frequent department in range. Bare array — both params required. */
export const getNotificationsSummaryAPI = (start_date: string, end_date: string) =>
  ApiService.fetchData<APIResponseNotificationSummary>({
    url: '/manage/notifications/summary',
    method: 'GET',
    params: { start_date, end_date },
  })

/** GET /manage/notifications/camera-outage — per-camera stream-outage feed
 *  (docs/notifications/FRONTEND_NOTIFICATIONS.md). Fixed sort started_at
 *  DESC; success = HTTP 200 (GET success carries no res_code). JWT scopes
 *  rows server-side — no role/scope params. Badge use: pass
 *  { unread_only: true, status: 'open', since_hours: 24, limit: 1 } and read
 *  meta_data.count. */
export const getCameraOutageNotificationsAPI = (params: CameraOutageListParams) =>
  ApiService.fetchData<APIResponseCameraOutageList>({
    url: '/manage/notifications/camera-outage',
    method: 'GET',
    params,
  })

/** POST /manage/notifications/camera-outage/read — mark `{ids:[...]}` (≤500
 *  per call) or `{all:true}` (everything visible to the user, ignores
 *  since_hours). Idempotent: repeats give marked:0, never an error. Read
 *  state is per-user. */
export const markCameraOutageReadAPI = (body: APIRequestMarkCameraOutageRead) =>
  ApiService.fetchData<APIResponseMarkCameraOutageRead>({
    url: '/manage/notifications/camera-outage/read',
    method: 'POST',
    data: body,
  })
