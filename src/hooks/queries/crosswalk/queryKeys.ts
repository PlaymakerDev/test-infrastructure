// Centralized query key factory for the Crosswalk feature.

import { scopeKey } from '@/services/routes/scopeParam'
import type {
  APIRequestCrosswalkCentralList,
  APIRequestCrosswalkOverview,
} from '@/types/crosswalk/overview-api'
import type {
  APIRequestCrosswalkCameras,
  APIRequestCrosswalkSummaryDaily,
  APIRequestCrosswalkGraph,
  APIRequestCrosswalkViolationList,
} from '@/types/crosswalk/detail-api'

export const crosswalkKeys = {
  all: ['crosswalk'] as const,

  overview: {
    // `scopeKey()` keys the cache apart per URL scope — see scopeParam.ts.
    root: (deptId: string | number) =>
      [...crosswalkKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (
      deptId: string | number,
      params: APIRequestCrosswalkOverview = {}
    ) =>
      [...crosswalkKeys.overview.root(deptId), 'map', params] as const,
    centralList: (
      deptId: string | number,
      params: APIRequestCrosswalkCentralList = {}
    ) =>
      [
        ...crosswalkKeys.overview.root(deptId),
        'central-list',
        params,
      ] as const,
    randomCameras: (deptId: string | number, limit: number) =>
      [
        ...crosswalkKeys.overview.root(deptId),
        'random-cameras',
        limit,
      ] as const,
    totals: (deptId: string | number) =>
      [...crosswalkKeys.overview.root(deptId), 'totals'] as const,
  },

  detail: {
    all: (id: string | number) =>
      [...crosswalkKeys.all, 'detail', id] as const,
    cameras: (
      deptId: string | number,
      params: APIRequestCrosswalkCameras = {}
    ) =>
      [
        ...crosswalkKeys.detail.all(params.solution_id ?? 'all'),
        'cameras',
        deptId,
        params,
      ] as const,
    solutionDetail: (id: string | number) =>
      [...crosswalkKeys.detail.all(id), 'solution-detail'] as const,
    summaryDaily: (params: APIRequestCrosswalkSummaryDaily) =>
      [
        ...crosswalkKeys.detail.all(params.solution_id),
        'summary-daily',
        params.start_date ?? 'today',
        params.end_date ?? '',
      ] as const,
    graph: (params: APIRequestCrosswalkGraph) =>
      [
        ...crosswalkKeys.detail.all(params.solution_id),
        'graph',
        params.start_date ?? 'today',
      ] as const,
    violationList: (params: APIRequestCrosswalkViolationList) =>
      [
        // solution_id is optional on this request — same 'all' fallback as
        // the `cameras` key above (params in the key disambiguates fully).
        ...crosswalkKeys.detail.all(params.solution_id ?? 'all'),
        'violation-list',
        params,
      ] as const,
  },
} as const
