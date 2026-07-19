import ApiService from "../ApiService"
import type {
  SummaryItem,
  WarrantySummaryItem,
  OfflineRoadItem,
  SolutionDetailResponse,
  CaseDetail,
  CaseHistoryItem,
  HistoryRegion,
  DetailBureau,
  CreateCaseRequest,
  UpdateCaseRequest,
  MaintenanceCaseParams,
  MaintenanceHistoryParams,
  RegionItem,
  UptimeStatistics,
} from "@/types/maintenance"
import type { APIResponseProjectDetail, UploadResponse } from "@/types/shared"

// --- Summary APIs ---

export const getMaintenanceSummaryAPI = async (solutionTypeId?: number) => {
  return ApiService.fetchData<SummaryItem[]>({
    url: '/manage/maintenance/summary',
    method: 'GET',
    params: solutionTypeId ? { solution_type_id: solutionTypeId } : undefined,
  })
}

/**
 * GET /{prefix}/departments/{departmentId}/{cameras|overview}/uptime-statistics?scope=all
 * — per-domain online percentage backing Solution Overview's rings. `prefix`
 * is the lowercased `SummaryItem.type` (cctv/traffic/lighting/vms/wim/crosswalk/tunnel);
 * CCTV's path segment is `cameras`, every other confirmed domain uses `overview`.
 * `departmentId=0` is "all departments" (this page has no department filter).
 */
export const getUptimeStatisticsAPI = async (prefix: string, departmentId: number = 0) => {
  const segment = prefix === 'cctv' ? 'cameras' : 'overview'
  return ApiService.fetchData<UptimeStatistics>({
    url: `/${prefix}/departments/${departmentId}/${segment}/uptime-statistics`,
    method: 'GET',
    params: { scope: 'all' },
  })
}

export const getMaintenanceWarrantySummaryAPI = async () => {
  return ApiService.fetchData<WarrantySummaryItem[]>({
    url: '/manage/maintenance/warranty-summary',
    method: 'GET',
  })
}

// --- Offline & Detail APIs ---

export const getMaintenanceOfflineRoadsAPI = async (offlineSince?: string) => {
  return ApiService.fetchData<OfflineRoadItem[]>({
    url: '/manage/maintenance/offline-roads',
    method: 'GET',
    params: offlineSince ? { offline_since: offlineSince } : undefined,
  })
}

export const getMaintenanceDetailAPI = async (solutionTypeId: number) => {
  return ApiService.fetchData<DetailBureau[]>({
    url: `/manage/maintenance/detail/${solutionTypeId}`,
    method: 'GET',
  })
}

// --- Solution & Case APIs ---

export const getMaintenanceSolutionAPI = async (solutionId: number) => {
  return ApiService.fetchData<SolutionDetailResponse>({
    url: `/manage/maintenance/solution/${solutionId}`,
    method: 'GET',
  })
}

/**
 * GET /manage/project/solution/{solution_id} — resolves a solution to its owning
 * project (same shape as GET /manage/project/{id}). The maintenance detail route's
 * `id` IS the solution_id, so this yields the project_id the ⓘ "ดูข้อมูลโครงการ"
 * modal needs directly from the URL, instead of relying on the sessionStorage
 * hand-off from the repair-history tree (absent on a direct visit to the route).
 */
export const getProjectBySolutionAPI = async (solutionId: number) => {
  return ApiService.fetchData<APIResponseProjectDetail>({
    url: `/manage/project/solution/${solutionId}`,
    method: 'GET',
  })
}

/**
 * `/manage/maintenance/solution/{id}` carries no coordinates. Every feature's
 * own overall-page overview endpoint does — `GET {prefix}/departments/{id}/overview`
 * returns `{ locations: [{ GeometryPoint: [lng, lat], ... }] }`, and `solution_id`
 * narrows it to exactly this device. `prefix` is the feature's URL segment
 * (cctv/counting/analytic/traffic/crosswalk/vms/lighting/tunnel/wim) — the
 * lowercased `SummaryItem.type` label from `/manage/maintenance/summary`.
 */
export const getSolutionMapLocationAPI = async (prefix: string, departmentId: number, solutionId: number) => {
  return ApiService.fetchData<{ locations?: { GeometryPoint?: [number, number] }[] }>({
    url: `/${prefix}/departments/${departmentId}/overview`,
    method: 'GET',
    params: { solution_id: solutionId, scope: 'all' },
  })
}

export const getMaintenanceCasesAPI = async (
  solutionId: number,
  params?: MaintenanceCaseParams
) => {
  return ApiService.fetchData<CaseHistoryItem[]>({
    url: `/manage/maintenance/cases/${solutionId}`,
    method: 'GET',
    params,
  })
}

// --- History API ---

export const getMaintenanceHistoryAPI = async (params?: MaintenanceHistoryParams) => {
  return ApiService.fetchData<HistoryRegion[]>({
    url: '/manage/maintenance/history',
    method: 'GET',
    params,
  })
}

// --- Case CRUD APIs ---

export const createMaintenanceCaseAPI = async (data: CreateCaseRequest) => {
  return ApiService.fetchData<unknown, CreateCaseRequest>({
    url: '/manage/maintenance/case',
    method: 'POST',
    data,
  })
}

export const getMaintenanceCaseAPI = async (caseNo: string) => {
  return ApiService.fetchData<CaseDetail>({
    url: `/manage/maintenance/case/${caseNo}`,
    method: 'GET',
  })
}

export const updateMaintenanceCaseAPI = async (caseNo: string, data: UpdateCaseRequest) => {
  return ApiService.fetchData<unknown, UpdateCaseRequest>({
    url: `/manage/maintenance/case/${caseNo}`,
    method: 'PUT',
    data,
  })
}

/** Before/after repair image or video upload for a case, mirrors `postUploadVMSAPI`'s shape. */
export const postUploadMaintenanceAPI = async (form: FormData) =>
  ApiService.fetchData<UploadResponse, FormData>({
    url: '/upload/maintenance',
    method: 'POST',
    data: form,
    params: { full_url: true },
  })

// --- Region API ---

export const getRegionsAPI = async () => {
  return ApiService.fetchData<RegionItem[]>({
    url: '/manage/regions',
    method: 'GET',
  })
}
