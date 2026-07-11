// Centralized query key factory for the tracking/detail/wim module (serves both the
// WIM and STATION detail routes). Mirrors control-vms/overall/data/queryKeys.ts.

import type {
  APIRequestLast7Days,
  APIRequestPCU,
  APIRequestPositionByID,
  APIRequestStationDaily,
  APIRequestWeightStationLog,
  APIRequestWeightWIMLog,
  APIRequestWIMDaily,
} from '@/types/tracking/detail-api'
import type { APIRequestTrackingCCTVList } from '@/types/tracking/overall-api'

export const trackingWimKeys = {
  all: ['tracking', 'wim-detail'] as const,

  stationById: (id?: string | number) =>
    [...trackingWimKeys.all, 'station-by-id', String(id ?? '')] as const,
  wimById: (id?: string | number) =>
    [...trackingWimKeys.all, 'wim-by-id', String(id ?? '')] as const,
  positionById: (params: APIRequestPositionByID) =>
    [...trackingWimKeys.all, 'position-by-id', params] as const,
  pcu: (params: APIRequestPCU) =>
    [...trackingWimKeys.all, 'pcu', params] as const,
  calibration: (stationType?: number | null, id?: string | number) =>
    [...trackingWimKeys.all, 'calibration', stationType ?? 'all', String(id ?? '')] as const,
  weightWimLog: (params: APIRequestWeightWIMLog) =>
    [...trackingWimKeys.all, 'weight-wim-log', params] as const,
  weightStationLog: (params: APIRequestWeightStationLog) =>
    [...trackingWimKeys.all, 'weight-station-log', params] as const,
  weightWimLogById: (id?: string | number, stationTypeId?: number | null) =>
    [...trackingWimKeys.all, 'weight-wim-log-by-id', String(id ?? ''), stationTypeId ?? ''] as const,
  weightStationLogById: (id?: string | number) =>
    [...trackingWimKeys.all, 'weight-station-log-by-id', String(id ?? '')] as const,
  stationDaily: (params: APIRequestStationDaily) =>
    [...trackingWimKeys.all, 'station-daily', params] as const,
  wimDaily: (params: APIRequestWIMDaily) =>
    [...trackingWimKeys.all, 'wim-daily', params] as const,
  last7Days: (params: APIRequestLast7Days) =>
    [...trackingWimKeys.all, 'last-7-days', params] as const,
  trafficAvgSpeed: (id?: string | number) =>
    [...trackingWimKeys.all, 'traffic-avg-speed', String(id ?? '')] as const,
  cctvList: (params: APIRequestTrackingCCTVList) =>
    [...trackingWimKeys.all, 'cctv-list', params] as const,
} as const
