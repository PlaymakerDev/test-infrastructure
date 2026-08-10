// Barrel for Dashboard query hooks.
import { useQuery } from '@tanstack/react-query'
import {
  getDashboardCctvUptimeAPI,
  getDashboardVmsUptimeAPI,
  getDashboardLightingUptimeAPI,
  getDashboardTrafficUptimeAPI,
  getDashboardWimUptimeAPI,
  getDashboardCrosswalkUptimeAPI,
  getDashboardTunnelUptimeAPI,
  getDashboardPositionAPI,
  getDashboardAnalyticAPI,
  getDashboardTrafficAPI,
  getDashboardCountingAPI,
} from '@/services/routes/DashboardService'
import type { DashboardBucketType } from '@/types/dashboard/api'
import { useScopeAll } from '@/hooks/useScopeAll'
import { dashboardKeys } from './queryKeys'

export { dashboardKeys } from './queryKeys'

// `deptId` is sometimes missing on first render — `enabled` keeps the hook idle
// instead of firing the request with an empty path segment.
//
// Scope (`?scope=all` in the page URL) is read via the REACTIVE `useScopeAll()`
// and passed explicitly into both the query key and (for the endpoints BE
// supports) the request — never via render-time `window` reads, which went
// stale during App Router transitions and pinned components to the previous
// scope's cache entry (dashboard map showed 3 markers while cards showed the
// 2,520-location scope).

export const useDashboardCctvUptime = (
  deptId: string | number | null | undefined,
  /** สายทาง scope — forwarded as `&road_id=`; BE still ignores it on this
   *  endpoint, so the response stays dept-wide (see roadParam). */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('cctv', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardCctvUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardVmsUptime = (
  deptId: string | number | null | undefined,
  /** Optional สายทาง scope — this endpoint honours `&road_id=`. */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('vms', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardVmsUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardLightingUptime = (
  deptId: string | number | null | undefined,
  /** Optional สายทาง scope — this endpoint honours `&road_id=`. */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('lighting', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardLightingUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTrafficUptime = (
  deptId: string | number | null | undefined,
  /** Optional สายทาง scope — this endpoint honours `&road_id=`. */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('traffic', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardTrafficUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardWimUptime = (
  deptId: string | number | null | undefined,
  /** สายทาง scope — forwarded as `&road_id=`; BE still ignores it on this
   *  endpoint, so the response stays dept-wide (see roadParam). */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('wim', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardWimUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardCrosswalkUptime = (
  deptId: string | number | null | undefined,
  /** Optional สายทาง scope — this endpoint honours `&road_id=`. */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('crosswalk', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardCrosswalkUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTunnelUptime = (
  deptId: string | number | null | undefined,
  /** Optional สายทาง scope — this endpoint honours `&road_id=`. */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('tunnel', deptId ?? '', scope, roadId),
    queryFn: () => getDashboardTunnelUptimeAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

/** Install points for the map + every count-style card. `roadId` narrows to one
 *  สายทาง (BE-supported here — see `roadParam` in DashboardService), which is
 *  what makes the KPI tiles / จุดติดตั้ง / สายทาง counters road-scoped. */
export const useDashboardPosition = (
  deptId: string | number | null | undefined,
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  const scoped = roadId != null && roadId !== ''
  return useQuery({
    queryKey: scoped
      ? dashboardKeys.positionByRoad(deptId ?? '', scope, roadId)
      : dashboardKeys.position(deptId ?? '', scope),
    queryFn: () => getDashboardPositionAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

/** One สายทาง's install points, idle until a road id exists. Backs the
 *  `?road_id=` landing's fly-to: the map fits THIS payload's bbox (BE-filtered,
 *  so it's right even when the dept-wide pool doesn't carry the road). The map's
 *  marker POOL still fetches dept-wide and filters client-side, so clearing the
 *  road scope needs no refetch. */
export const useDashboardRoadPosition = (
  deptId: string | number | null | undefined,
  roadId: string | number | null | undefined,
) => useDashboardPosition(roadId ? deptId : null, roadId)

export const useDashboardAnalytic = (
  deptId: string | number | null | undefined,
  type: DashboardBucketType,
  /** สายทาง scope — forwarded as `&road_id=`; BE still ignores it on this
   *  endpoint, so the response stays dept-wide (see roadParam). */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.analytic(deptId ?? '', type, scope, roadId),
    queryFn: () => getDashboardAnalyticAPI(deptId!, type, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTraffic = (
  deptId: string | number | null | undefined,
  type: DashboardBucketType,
  limit = 5,
  /** สายทาง scope — forwarded as `&road_id=`; BE still ignores it on this
   *  endpoint, so the response stays dept-wide (see roadParam). */
  roadId?: string | number | null,
) =>
  useQuery({
    queryKey: dashboardKeys.traffic(deptId ?? '', type, limit, roadId),
    queryFn: () => getDashboardTrafficAPI(deptId!, type, limit, roadId).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardCounting = (
  deptId: string | number | null | undefined,
  /** สายทาง scope — forwarded as `&road_id=`; BE still ignores it on this
   *  endpoint, so the response stays dept-wide (see roadParam). */
  roadId?: string | number | null,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.counting(deptId ?? '', scope, roadId),
    queryFn: () => getDashboardCountingAPI(deptId!, scope === 'all', roadId).then((r) => r.data),
    enabled: !!deptId,
  })
}
