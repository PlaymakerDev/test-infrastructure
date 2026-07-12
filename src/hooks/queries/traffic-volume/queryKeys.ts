// Centralized query key factory for the Traffic Volume feature.

import { scopeKey } from '@/services/routes/scopeParam'
import type {
  APIRequestTrafficVolumeCentralList,
  APIRequestTrafficVolumeOverview,
} from '@/types/traffic-volume/overview-api'
import type {
  APIRequestTrafficVolumeCountHour,
  APIRequestTrafficVolumeCountPrevious,
  APIRequestTrafficVolumeSummaryDaily,
  APIRequestTrafficVolumeAnalyticSummary,
  APIRequestTrafficVolumeSpeedPercentile,
  APIRequestTrafficVolumeAnalyticGraph,
  APIRequestTrafficVolumeReportSummary,
} from '@/types/traffic-volume/detail-api'

export const trafficVolumeKeys = {
  all: ['traffic-volume'] as const,

  // License is keyed by solution_id only (endpoint is not department-scoped).
  license: (solutionId: string | number) =>
    [...trafficVolumeKeys.all, 'license', solutionId] as const,

  overview: {
    // `scopeKey()` keys the cache apart per URL scope — see scopeParam.ts.
    root: (deptId: string | number) =>
      [...trafficVolumeKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (
      deptId: string | number,
      params: APIRequestTrafficVolumeOverview = {}
    ) =>
      [...trafficVolumeKeys.overview.root(deptId), 'map', params] as const,
    centralList: (
      deptId: string | number,
      params: APIRequestTrafficVolumeCentralList = {}
    ) =>
      [
        ...trafficVolumeKeys.overview.root(deptId),
        'central-list',
        params,
      ] as const,
    totals: (deptId: string | number) =>
      [...trafficVolumeKeys.overview.root(deptId), 'totals'] as const,
    randomCameras: (deptId: string | number, limit: number) =>
      [
        ...trafficVolumeKeys.overview.root(deptId),
        'random-cameras',
        limit,
      ] as const,
  },

  detail: {
    all: (id: string | number) =>
      [...trafficVolumeKeys.all, 'detail', id] as const,
    cameras: (deptId: string | number, solutionId: string | number) =>
      [
        ...trafficVolumeKeys.detail.all(solutionId),
        'cameras',
        deptId,
      ] as const,
    /** Richer camera list from `/cameras/list` — separate key from `cameras`
     *  because the response envelope + row shape differ (no centroid, no
     *  geometry_point; ip_address + is_online carried inline). */
    cameraList: (
      deptId: string | number,
      solutionId: string | number,
      page: number,
      limit: number
    ) =>
      [
        ...trafficVolumeKeys.detail.all(solutionId),
        'camera-list',
        deptId,
        page,
        limit,
      ] as const,
    countHour: (params: APIRequestTrafficVolumeCountHour) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'count-hour',
        params.date ?? 'today',
      ] as const,
    countPrevious: (params: APIRequestTrafficVolumeCountPrevious) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'count-previous',
        params.last ?? 7,
      ] as const,
    summaryDaily: (params: APIRequestTrafficVolumeSummaryDaily) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'summary-daily',
        params.date ?? 'today',
      ] as const,
    solutionDetail: (id: string | number) =>
      [...trafficVolumeKeys.detail.all(id), 'solution-detail'] as const,
    analyticSummary: (params: APIRequestTrafficVolumeAnalyticSummary) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'analytic-summary',
        params.date ?? 'today',
      ] as const,
    speedPercentile: (params: APIRequestTrafficVolumeSpeedPercentile) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'speed-percentile',
        params.date ?? 'today',
      ] as const,
    analyticGraph: (params: APIRequestTrafficVolumeAnalyticGraph) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'analytic-graph',
        params.date ?? 'today',
      ] as const,
    /** Report-mode rollup. The cache key folds in report_type + date range +
     *  camera so each toolbar combination keeps its own slot. */
    reportSummary: (params: APIRequestTrafficVolumeReportSummary) =>
      [
        ...trafficVolumeKeys.detail.all(params.solution_id),
        'report-summary',
        params.report_type,
        params.start_date,
        params.end_date,
        params.camera_id ?? 'all',
        params.page ?? 1,
        params.limit ?? 'default',
      ] as const,
  },
} as const
