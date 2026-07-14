// Query key factory for Dashboard hooks.
import type { DashboardBucketType } from '@/types/dashboard/api'

/** Scope segment for uptime/position keys — responses differ per URL scope
 *  since BE shipped `scope=all`. Passed EXPLICITLY by the hooks (sourced from
 *  the reactive `useScopeAll()`), never read from `window` here: render-time
 *  window reads went stale during App Router transitions and pinned the map
 *  to the previous scope's cache entry. */
export type DashboardScope = 'all' | 'own'

export const dashboardKeys = {
  all: ['dashboard'] as const,

  uptime: (
    feature: 'cctv' | 'vms' | 'lighting' | 'traffic' | 'wim' | 'crosswalk' | 'tunnel',
    deptId: string | number,
    scope: DashboardScope,
  ) =>
    [...dashboardKeys.all, 'uptime', feature, deptId, scope] as const,

  position: (deptId: string | number, scope: DashboardScope) =>
    [...dashboardKeys.all, 'position', deptId, scope] as const,

  analytic: (deptId: string | number, type: DashboardBucketType, scope: DashboardScope) =>
    [...dashboardKeys.all, 'analytic', deptId, type, scope] as const,

  traffic: (deptId: string | number, type: DashboardBucketType, limit: number) =>
    [...dashboardKeys.all, 'traffic', deptId, type, limit] as const,

  counting: (deptId: string | number, scope: DashboardScope) =>
    [...dashboardKeys.all, 'counting', deptId, scope] as const,
} as const
