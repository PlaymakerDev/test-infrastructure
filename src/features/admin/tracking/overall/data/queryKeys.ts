// Centralized query key factory for the tracking/overall module.
// Mirrors control-vms/overall/data/queryKeys.ts and tracking/detail/{wim,mobile}/data/queryKeys.ts.

import type {
  APIRequestTrackingAllDepartment,
  APIRequestTrackingCCTVList,
  APIRequestTrackingCollaboration,
  APIRequestTrackingDailySum,
  APIRequestTrackingMobileMaster,
  APIRequestTrackingPosition,
  APIRequestTrackingSumStation,
  APIRequestTrackingSumWeightYearV2,
  APIRequestTrackingSumWim,
  APIRequestTrackingTotalStation,
  APIRequestTrackingViewSumPlanChart,
  APIRequestTrackingWeightInspection,
} from '@/types/tracking/overall-api'
import type {
  APIRequestMobileDailyCount,
  APIRequestStationDailyCount,
  APIRequestWIMDailyCount,
} from '@/types/tracking/detail-api'

export const trackingOverallKeys = {
  all: ['tracking', 'overall'] as const,

  cctvList: (params: APIRequestTrackingCCTVList) =>
    [...trackingOverallKeys.all, 'cctv-list', params] as const,
  dailySum: (params: APIRequestTrackingDailySum) =>
    [...trackingOverallKeys.all, 'daily-sum', params] as const,
  totalStation: (params: APIRequestTrackingTotalStation) =>
    [...trackingOverallKeys.all, 'total-station', params] as const,
  weightInspection: (params: APIRequestTrackingWeightInspection) =>
    [...trackingOverallKeys.all, 'weight-inspection', params] as const,
  sumWeightYearV2: (params: APIRequestTrackingSumWeightYearV2) =>
    [...trackingOverallKeys.all, 'sum-weight-year-v2', params] as const,
  sumPlanChart: (params: APIRequestTrackingViewSumPlanChart) =>
    [...trackingOverallKeys.all, 'sum-plan-chart', params] as const,
  position: (params: APIRequestTrackingPosition) =>
    [...trackingOverallKeys.all, 'position', params] as const,
  sumStation: (params: APIRequestTrackingSumStation) =>
    [...trackingOverallKeys.all, 'sum-station', params] as const,
  sumWim: (params: APIRequestTrackingSumWim) =>
    [...trackingOverallKeys.all, 'sum-wim', params] as const,
  collaboration: (params: APIRequestTrackingCollaboration) =>
    [...trackingOverallKeys.all, 'collaboration', params] as const,
  mobileMaster: (params: APIRequestTrackingMobileMaster) =>
    [...trackingOverallKeys.all, 'mobile-master', params] as const,
  allDepartment: (params: APIRequestTrackingAllDepartment) =>
    [...trackingOverallKeys.all, 'all-department', params] as const,
  stationDailyCount: (params: APIRequestStationDailyCount) =>
    [...trackingOverallKeys.all, 'station-daily-count', params] as const,
  wimDailyCount: (params: APIRequestWIMDailyCount) =>
    [...trackingOverallKeys.all, 'wim-daily-count', params] as const,
  mobileDailyCount: (params: APIRequestMobileDailyCount) =>
    [...trackingOverallKeys.all, 'mobile-daily-count', params] as const,
} as const
