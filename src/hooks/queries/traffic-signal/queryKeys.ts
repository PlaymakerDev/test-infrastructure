// Centralized query key factory for the Traffic Signal feature.
//
// Using a factory keeps cache invalidation type-safe and consistent — e.g.,
// `queryClient.invalidateQueries({ queryKey: trafficSignalKeys.detail.all(id) })`
// invalidates every nested detail query for the given id.

import { scopeKey } from '@/services/routes/scopeParam'
import type {
  APIRequestTrafficOverview,
  APIRequestTrafficList,
  APIRequestTrafficOverviewDropdowns,
  APIRequestTrafficCameraList,
  APIRequestTrafficCameraDropdowns,
} from '@/types/traffic-signal/overview-api'
import type {
  APIRequestTrafficSummary,
  APIRequestTrafficReports,
} from '@/types/traffic-signal/detail-api'

export const trafficSignalKeys = {
  all: ['traffic-signal'] as const,

  // ── Overview keys ────────────────────────────────────────────────────────
  overview: {
    // `scopeKey()` keys the cache apart per URL scope — see scopeParam.ts.
    root: (deptId: string | number) =>
      [...trafficSignalKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (deptId: string | number, params: APIRequestTrafficOverview = {}) =>
      [...trafficSignalKeys.overview.root(deptId), 'map', params] as const,
    totals: (deptId: string | number) =>
      [...trafficSignalKeys.overview.root(deptId), 'totals'] as const,
    list: (deptId: string | number, params: APIRequestTrafficList) =>
      [...trafficSignalKeys.overview.root(deptId), 'list', params] as const,
    centralList: (deptId: string | number) =>
      [...trafficSignalKeys.overview.root(deptId), 'central-list'] as const,
    dropdowns: (deptId: string | number, params: APIRequestTrafficOverviewDropdowns) =>
      [...trafficSignalKeys.overview.root(deptId), 'dropdowns', params] as const,
    randomCameras: (deptId: string | number, limit: number) =>
      [...trafficSignalKeys.overview.root(deptId), 'random-cameras', limit] as const,
    cameraList: (deptId: string | number, params: APIRequestTrafficCameraList) =>
      [...trafficSignalKeys.overview.root(deptId), 'camera-list', params] as const,
    cameraCentralList: (deptId: string | number) =>
      [...trafficSignalKeys.overview.root(deptId), 'camera-central-list'] as const,
    cameraDropdowns: (deptId: string | number, params: APIRequestTrafficCameraDropdowns) =>
      [...trafficSignalKeys.overview.root(deptId), 'camera-dropdowns', params] as const,
  },

  // ── Detail keys ──────────────────────────────────────────────────────────
  detail: {
    all: (id: string | number) => [...trafficSignalKeys.all, 'detail', id] as const,
    contractInfo: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'contract-info'] as const,
    solutionDetail: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'solution-detail'] as const,
    main: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'main'] as const,
    phaseDetails: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'phase-details'] as const,
    cameras: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'cameras'] as const,
    graph: (id: string | number) =>
      [...trafficSignalKeys.detail.all(id), 'graph'] as const,
    summary: (id: string | number, params: APIRequestTrafficSummary) =>
      [...trafficSignalKeys.detail.all(id), 'summary', params] as const,
    reports: (id: string | number, params: APIRequestTrafficReports) =>
      [...trafficSignalKeys.detail.all(id), 'reports', params] as const,
  },
} as const
