// Centralized query key factory for the tracking/detail/mobile module.
// Mirrors control-vms/overall/data/queryKeys.ts and tracking/detail/wim/data/queryKeys.ts.

import type {
  APIRequestMobileCar,
  APIRequestMobileDailyCount,
  APIRequestMobileMaster,
} from '@/types/tracking/detail-api'

export const trackingMobileKeys = {
  all: ['tracking', 'mobile-detail'] as const,

  departmentByTID: (id?: string | number) =>
    [...trackingMobileKeys.all, 'department-by-tid', String(id ?? '')] as const,
  dailyCount: (params: APIRequestMobileDailyCount) =>
    [...trackingMobileKeys.all, 'daily-count', params] as const,
  master: (params: APIRequestMobileMaster) =>
    [...trackingMobileKeys.all, 'master', params] as const,
  car: (params: APIRequestMobileCar) =>
    [...trackingMobileKeys.all, 'car', params] as const,
} as const
