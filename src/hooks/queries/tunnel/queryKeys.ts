// Centralized query key factory for the Tunnel feature.

import { scopeKey } from '@/services/routes/scopeParam'
import type {
  APIRequestTunnelCentralList,
  APIRequestTunnelOverview,
} from '@/types/tunnel/overview-api'

export const tunnelKeys = {
  all: ['tunnel'] as const,

  overview: {
    // `scopeKey()` keys the cache apart per URL scope — see scopeParam.ts.
    root: (deptId: string | number) =>
      [...tunnelKeys.all, 'overview', deptId, scopeKey()] as const,
    map: (
      deptId: string | number,
      params: APIRequestTunnelOverview = {}
    ) =>
      [...tunnelKeys.overview.root(deptId), 'map', params] as const,
    centralList: (
      deptId: string | number,
      params: APIRequestTunnelCentralList = {}
    ) =>
      [
        ...tunnelKeys.overview.root(deptId),
        'central-list',
        params,
      ] as const,
    randomCameras: (deptId: string | number, limit: number) =>
      [
        ...tunnelKeys.overview.root(deptId),
        'random-cameras',
        limit,
      ] as const,
    totals: (deptId: string | number) =>
      [...tunnelKeys.overview.root(deptId), 'totals'] as const,
  },
} as const
