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
  ContractorSummaryRow,
} from "@/types/maintenance"

// --- Summary APIs ---

export const getMaintenanceSummaryAPI = async (solutionTypeId?: number) => {
  return ApiService.fetchData<SummaryItem[]>({
    url: '/manage/maintenance/summary',
    method: 'GET',
    params: solutionTypeId ? { solution_type_id: solutionTypeId } : undefined,
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

// --- Region API ---

export const getRegionsAPI = async () => {
  return ApiService.fetchData<RegionItem[]>({
    url: '/manage/regions',
    method: 'GET',
  })
}

/** GET /manage/maintenance/contractor-summary — one row per contractor,
 *  sorted server-side by total_offline DESC. Full list (~60 rows). */
export const getContractorSummaryAPI = async () => {
  return ApiService.fetchData<ContractorSummaryRow[]>({
    url: '/manage/maintenance/contractor-summary',
    method: 'GET',
  })
}
