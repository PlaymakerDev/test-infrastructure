// Query key factory for the Incident Detection (/analytic) feature.
import type { APIRequestIncidentList } from '@/types/incident-detection/overview-api'
import type {
  APIRequestIncidentCameraList,
  APIRequestIncidentCameraTotals,
} from '@/types/incident-detection/camera-api'
import type {
  APIRequestIncidentDaily,
  APIRequestIncidentTransactions,
} from '@/types/incident-detection/details-api'

export const incidentKeys = {
  all: ['incident-detection'] as const,

  overview: {
    root: (deptId: string | number) =>
      [...incidentKeys.all, 'overview', deptId] as const,
    map: (deptId: string | number, scope?: string) =>
      [...incidentKeys.overview.root(deptId), 'map', scope ?? ''] as const,
    totals: (deptId: string | number) =>
      [...incidentKeys.overview.root(deptId), 'totals'] as const,
    centralTotals: (deptId: string | number) =>
      [...incidentKeys.overview.root(deptId), 'central-totals'] as const,
    centralList: (deptId: string | number, scope?: string) =>
      [...incidentKeys.overview.root(deptId), 'central-list', scope ?? ''] as const,
    list: (deptId: string | number, params: APIRequestIncidentList) =>
      [...incidentKeys.overview.root(deptId), 'list', params] as const,
  },

  cameras: {
    root: (deptId: string | number) =>
      [...incidentKeys.all, 'cameras', deptId] as const,
    bySolution: (deptId: string | number, solutionId: string | number) =>
      [...incidentKeys.cameras.root(deptId), 'by-solution', solutionId] as const,
    randomOnline: (deptId: string | number, limit: number) =>
      [...incidentKeys.cameras.root(deptId), 'random-online', limit] as const,
    list: (deptId: string | number, params: APIRequestIncidentCameraList) =>
      [...incidentKeys.cameras.root(deptId), 'list', params] as const,
    totals: (deptId: string | number, params: APIRequestIncidentCameraTotals) =>
      [...incidentKeys.cameras.root(deptId), 'totals', params] as const,
  },

  details: {
    root: () => [...incidentKeys.all, 'details'] as const,
    daily: (params: APIRequestIncidentDaily) =>
      [...incidentKeys.details.root(), 'daily', params] as const,
    transactions: (params: APIRequestIncidentTransactions) =>
      [...incidentKeys.details.root(), 'transactions', params] as const,
    peakHour: (solutionId: string | number) =>
      [...incidentKeys.details.root(), 'peak-hour', solutionId] as const,
  },

  // License is keyed by solution_id only (endpoint is not department-scoped).
  license: (solutionId: string | number) =>
    [...incidentKeys.all, 'license', solutionId] as const,

  byDepartment: (deptId: string | number, params: { start_date?: string; end_date?: string }) =>
    [...incidentKeys.all, 'by-department', deptId, params] as const,

  incidentsSummary: (deptId: string | number, params: { scope?: string; since?: string; until?: string }) =>
    [...incidentKeys.all, 'incidents-summary', deptId, params] as const,

  iotStatus: (deptId: string | number, params: { scope?: string }) =>
    [...incidentKeys.all, 'iot-status', deptId, params] as const,

  iotStatusSummary: (deptId: string | number, params: { scope?: string }) =>
    [...incidentKeys.all, 'iot-status-summary', deptId, params] as const,
} as const
