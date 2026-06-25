// Centralized query key factory for the CCTV feature.
//
// A factory keeps cache invalidation type-safe and consistent — e.g.
// `queryClient.invalidateQueries({ queryKey: cctvKeys.overview.root(deptId) })`
// drops every overview query for the department.

import type {
  APIRequestCCTVOverviewList,
  APIRequestCCTVOverviewDropdowns,
} from '@/types/cctv/overview-api'
import type {
  APIRequestCCTVCameras,
  APIRequestCCTVCameraList,
  APIRequestCCTVCameraTotals,
  APIRequestCCTVCameraDropdowns,
  APIRequestCCTVUptime,
} from '@/types/cctv/camera-api'

export const cctvKeys = {
  all: ['cctv'] as const,

  // ── Overview (solution-level) ──────────────────────────────────────────────
  overview: {
    root: (deptId: string | number) =>
      [...cctvKeys.all, 'overview', deptId] as const,
    map: (deptId: string | number) =>
      [...cctvKeys.overview.root(deptId), 'map'] as const,
    list: (deptId: string | number, params: APIRequestCCTVOverviewList) =>
      [...cctvKeys.overview.root(deptId), 'list', params] as const,
    totals: (deptId: string | number) =>
      [...cctvKeys.overview.root(deptId), 'totals'] as const,
    dropdowns: (
      deptId: string | number,
      params: APIRequestCCTVOverviewDropdowns
    ) => [...cctvKeys.overview.root(deptId), 'dropdowns', params] as const,
    centralList: (deptId: string | number) =>
      [...cctvKeys.overview.root(deptId), 'central-list'] as const,
    centralTotals: (deptId: string | number) =>
      [...cctvKeys.overview.root(deptId), 'central-totals'] as const,
  },

  // ── Camera-level ───────────────────────────────────────────────────────────
  cameras: {
    root: (deptId: string | number) =>
      [...cctvKeys.all, 'cameras', deptId] as const,
    map: (deptId: string | number, params: APIRequestCCTVCameras) =>
      [...cctvKeys.cameras.root(deptId), 'map', params] as const,
    list: (deptId: string | number, params: APIRequestCCTVCameraList) =>
      [...cctvKeys.cameras.root(deptId), 'list', params] as const,
    totals: (deptId: string | number, params: APIRequestCCTVCameraTotals) =>
      [...cctvKeys.cameras.root(deptId), 'totals', params] as const,
    dropdowns: (
      deptId: string | number,
      params: APIRequestCCTVCameraDropdowns
    ) => [...cctvKeys.cameras.root(deptId), 'dropdowns', params] as const,
    randomOnline: (deptId: string | number, limit: number) =>
      [...cctvKeys.cameras.root(deptId), 'random-online', limit] as const,
    uptime: (deptId: string | number, params: APIRequestCCTVUptime) =>
      [...cctvKeys.cameras.root(deptId), 'uptime', params] as const,
  },

  // ── Camera central list (by road, not department-scoped) ───────────────────
  cameraCentralByRoad: (roadId: string | number) =>
    [...cctvKeys.all, 'camera-central', roadId] as const,
} as const
