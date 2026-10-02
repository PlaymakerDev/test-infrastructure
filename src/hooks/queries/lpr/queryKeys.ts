// Centralized query key factory for the LPR feature.

import type { LPRSourceFilter } from '@/types/lpr/lpr-api'
import type { APIRequestLPROverview } from '@/types/lpr/new-lpr-api'

export const lprKeys = {
  all: ['lpr'] as const,

  plates: {
    root: () => [...lprKeys.all, 'plates'] as const,
    // Cursor-paginated list — keyed on the filter params (not the cursor,
    // which useInfiniteQuery threads via pageParam).
    list: (params: { q?: string; source?: LPRSourceFilter; limit?: number }) =>
      [...lprKeys.plates.root(), 'list', params] as const,
  },

  points: {
    list: () => [...lprKeys.all, 'points'] as const,
  },

  overview: {
    root: () => [...lprKeys.all, 'overview'] as const,
    // Keyed on dept + params (scope / road_id) — plain vs scope=all return
    // very different payloads, so they must not share a cache entry.
    list: (deptId: string, params: APIRequestLPROverview) =>
      [...lprKeys.overview.root(), deptId, params] as const,
  },

  plate: {
    // (plate_number, plate_province) is the composite identity.
    root: (province: string, plateNumber: string) =>
      [...lprKeys.all, 'plate', province, plateNumber] as const,
    detail: (province: string, plateNumber: string) =>
      [...lprKeys.plate.root(province, plateNumber), 'detail'] as const,
    timeline: (province: string, plateNumber: string, limit?: number) =>
      [...lprKeys.plate.root(province, plateNumber), 'timeline', limit ?? 20] as const,
  },
} as const
