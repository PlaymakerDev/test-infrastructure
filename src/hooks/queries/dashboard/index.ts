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

export const useDashboardCctvUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('cctv', deptId ?? '', scope),
    queryFn: () => getDashboardCctvUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardVmsUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('vms', deptId ?? '', scope),
    queryFn: () => getDashboardVmsUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardLightingUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('lighting', deptId ?? '', scope),
    queryFn: () => getDashboardLightingUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTrafficUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('traffic', deptId ?? '', scope),
    queryFn: () => getDashboardTrafficUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardWimUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('wim', deptId ?? '', scope),
    queryFn: () => getDashboardWimUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardCrosswalkUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('crosswalk', deptId ?? '', scope),
    queryFn: () => getDashboardCrosswalkUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTunnelUptime = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.uptime('tunnel', deptId ?? '', scope),
    queryFn: () => getDashboardTunnelUptimeAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardPosition = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.position(deptId ?? '', scope),
    queryFn: () => getDashboardPositionAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardAnalytic = (
  deptId: string | number | null | undefined,
  type: DashboardBucketType,
) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.analytic(deptId ?? '', type, scope),
    queryFn: () => getDashboardAnalyticAPI(deptId!, type, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}

export const useDashboardTraffic = (
  deptId: string | number | null | undefined,
  type: DashboardBucketType,
  limit = 5,
) =>
  useQuery({
    queryKey: dashboardKeys.traffic(deptId ?? '', type, limit),
    queryFn: () => getDashboardTrafficAPI(deptId!, type, limit).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardCounting = (deptId: string | number | null | undefined) => {
  const scope = useScopeAll() ? 'all' as const : 'own' as const
  return useQuery({
    queryKey: dashboardKeys.counting(deptId ?? '', scope),
    queryFn: () => getDashboardCountingAPI(deptId!, scope === 'all').then((r) => r.data),
    enabled: !!deptId,
  })
}
