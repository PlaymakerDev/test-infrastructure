// Query key factory for Dashboard hooks.
import type { DashboardBucketType } from '@/types/dashboard/api'

/** Scope segment for uptime/position keys — responses differ per URL scope
 *  since BE shipped `scope=all`. Passed EXPLICITLY by the hooks (sourced from
 *  the reactive `useScopeAll()`), never read from `window` here: render-time
 *  window reads went stale during App Router transitions and pinned the map
 *  to the previous scope's cache entry. */
export type DashboardScope = 'all' | 'own'

/** Appends `'road', roadId` only when a สายทาง scope is active, so entries
 *  cached dept-wide (before road scope existed / after it's cleared) keep their
 *  original key. Applied uniformly to every node below — the request carries
 *  `road_id` uniformly too, even where BE still ignores it (see `roadParam` in
 *  DashboardService), so a key never claims a scope the response doesn't have. */
const withRoad = (
  base: readonly unknown[],
  roadId?: string | number | null,
): readonly unknown[] =>
  roadId != null && roadId !== '' ? [...base, 'road', roadId] : base

export const dashboardKeys = {
  all: ['dashboard'] as const,

  uptime: (
    feature: 'cctv' | 'vms' | 'lighting' | 'traffic' | 'wim' | 'crosswalk' | 'tunnel',
    deptId: string | number,
    scope: DashboardScope,
    roadId?: string | number | null,
  ) =>
    withRoad([...dashboardKeys.all, 'uptime', feature, deptId, scope], roadId),

  position: (deptId: string | number, scope: DashboardScope) =>
    [...dashboardKeys.all, 'position', deptId, scope] as const,

  /** Road-scoped variant of `position` — `/manage/solution/{dept}/position?road_id=`.
   *  Separate leaf (not an extra element on `position`) so the dept-wide pool the
   *  map markers rely on keeps its own cache entry untouched. */
  positionByRoad: (deptId: string | number, scope: DashboardScope, roadId: string | number) =>
    [...dashboardKeys.all, 'position', deptId, scope, 'road', roadId] as const,

  analytic: (
    deptId: string | number,
    type: DashboardBucketType,
    scope: DashboardScope,
    roadId?: string | number | null,
  ) =>
    withRoad([...dashboardKeys.all, 'analytic', deptId, type, scope], roadId),

  traffic: (
    deptId: string | number,
    type: DashboardBucketType,
    limit: number,
    roadId?: string | number | null,
  ) =>
    withRoad([...dashboardKeys.all, 'traffic', deptId, type, limit], roadId),

  counting: (
    deptId: string | number,
    scope: DashboardScope,
    roadId?: string | number | null,
  ) =>
    withRoad([...dashboardKeys.all, 'counting', deptId, scope], roadId),
} as const
