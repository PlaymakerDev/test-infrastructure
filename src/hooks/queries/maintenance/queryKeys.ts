import type { MaintenanceHistoryParams } from '@/types/maintenance'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  summary: (solutionTypeId?: number) =>
    [...maintenanceKeys.all, 'summary', solutionTypeId ?? 'all'] as const,
  warrantySummary: () => [...maintenanceKeys.all, 'warranty-summary'] as const,
  offlineRoads: (offlineSince?: string) =>
    [...maintenanceKeys.all, 'offline-roads', offlineSince ?? 'all'] as const,
  uptime: (prefix: string) => [...maintenanceKeys.all, 'uptime', prefix] as const,
  detail: (solutionTypeId?: number) =>
    [...maintenanceKeys.all, 'detail', solutionTypeId ?? 0] as const,
  history: (params?: MaintenanceHistoryParams) =>
    [
      ...maintenanceKeys.all,
      'history',
      params?.status ?? 'all',
      params?.region_id ?? null,
      params?.department_id ?? null,
      params?.road_code ?? null,
      params?.warranty ?? null,
      params?.category ?? null,
      params?.search ?? null,
      params?.date_from ?? null,
      params?.date_to ?? null,
    ] as const,
  solution: (solutionId?: number) =>
    [...maintenanceKeys.all, 'solution', solutionId ?? 0] as const,
  projectBySolution: (solutionId?: number) =>
    [...maintenanceKeys.all, 'project-by-solution', solutionId ?? 0] as const,
  mapLocation: (prefix?: string, departmentId?: number, solutionId?: number) =>
    [...maintenanceKeys.all, 'map-location', prefix ?? '', departmentId ?? 0, solutionId ?? 0] as const,
  cases: (solutionId?: number) =>
    [...maintenanceKeys.all, 'cases', solutionId ?? 0] as const,
  case: (caseNo?: string) => [...maintenanceKeys.all, 'case', caseNo ?? ''] as const,
} as const
