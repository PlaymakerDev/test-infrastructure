// Centralized query key factory for the CCTV feature.
//
// A factory keeps cache invalidation type-safe and consistent — e.g.
// `queryClient.invalidateQueries({ queryKey: cctvKeys.overview.root(deptId) })`
// drops every overview query for the department.

import type {
  APIRequestCCTVOverviewList,
  APIRequestCCTVOverviewDropdowns,
  APIRequestCCTVOverview,
  APIRequestCCTVOverviewCentralList,
  APIRequestCCTVOverviewCentralTotals,
} from '@/types/cctv/overview-api'
import type {
  APIRequestCCTVCameras,
  APIRequestCCTVCameraList,
  APIRequestCCTVCameraTotals,
  APIRequestCCTVCameraDropdowns,
  APIRequestCCTVUptime,
  APIRequestCCTVRandomOnline,
} from '@/types/cctv/camera-api'
import { scopeKey } from '@/services/routes/scopeParam'

export const cctvKeys = {
  all: ['cctv'] as const,

  // ── Overview (solution-level) ──────────────────────────────────────────────
  overview: {
    // `scopeKey()` keys the cache apart per URL scope (`?scope=all` vs plain)
    // — same dept can return very different data since BE shipped scope=all.
    root: (deptId: string | number) =>
      [...cctvKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (deptId: string | number, params?: APIRequestCCTVOverview) =>
      [...cctvKeys.overview.root(deptId), 'map', { ...params }] as const,
    list: (deptId: string | number, params: APIRequestCCTVOverviewList) =>
      [...cctvKeys.overview.root(deptId), 'list', params] as const,
    dropdowns: (
      deptId: string | number,
      params: APIRequestCCTVOverviewDropdowns
    ) => [...cctvKeys.overview.root(deptId), 'dropdowns', params] as const,
    centralList: (deptId: string | number, params?: APIRequestCCTVOverviewCentralList) =>
      [...cctvKeys.overview.root(deptId), 'central-list', { ...params }] as const,
    centralTotals: (deptId: string | number, params?: APIRequestCCTVOverviewCentralTotals) =>
      [...cctvKeys.overview.root(deptId), 'central-totals', { ...params }] as const,
  },

  // ── Camera-level ───────────────────────────────────────────────────────────
  cameras: {
    root: (deptId: string | number) =>
      [...cctvKeys.all, 'cameras', deptId, scopeKey()] as const,
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
    randomOnline: (deptId: string | number, params: APIRequestCCTVRandomOnline) =>
      [...cctvKeys.cameras.root(deptId), 'random-online', params] as const,
    // randomOnline: (deptId: string | number, limit: number) =>
    //   [...cctvKeys.cameras.root(deptId), 'random-online', limit] as const,
    uptime: (deptId: string | number, params: APIRequestCCTVUptime) =>
      [...cctvKeys.cameras.root(deptId), 'uptime', params] as const,
  },

  // ── Camera central list (by road, not department-scoped) ───────────────────
  cameraCentralByRoad: (roadId: string | number) =>
    [...cctvKeys.all, 'camera-central', roadId] as const,
} as const
