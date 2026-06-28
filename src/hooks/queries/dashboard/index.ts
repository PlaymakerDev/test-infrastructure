// Barrel for Dashboard query hooks.
import { useQuery } from '@tanstack/react-query'
import {
  getDashboardCctvUptimeAPI,
  getDashboardVmsUptimeAPI,
  getDashboardLightingUptimeAPI,
  getDashboardPositionAPI,
  getDashboardAnalyticAPI,
  getDashboardTrafficAPI,
  getDashboardCountingAPI,
} from '@/services/routes/DashboardService'
import type { DashboardBucketType } from '@/types/dashboard/api'
import { dashboardKeys } from './queryKeys'

export { dashboardKeys } from './queryKeys'

// `deptId` is sometimes missing on first render — `enabled` keeps the hook idle
// instead of firing the request with an empty path segment.

export const useDashboardCctvUptime = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: dashboardKeys.uptime('cctv', deptId ?? ''),
    queryFn: () => getDashboardCctvUptimeAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardVmsUptime = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: dashboardKeys.uptime('vms', deptId ?? ''),
    queryFn: () => getDashboardVmsUptimeAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardLightingUptime = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: dashboardKeys.uptime('lighting', deptId ?? ''),
    queryFn: () => getDashboardLightingUptimeAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardPosition = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: dashboardKeys.position(deptId ?? ''),
    queryFn: () => getDashboardPositionAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })

export const useDashboardAnalytic = (
  deptId: string | number | null | undefined,
  type: DashboardBucketType,
) =>
  useQuery({
    queryKey: dashboardKeys.analytic(deptId ?? '', type),
    queryFn: () => getDashboardAnalyticAPI(deptId!, type).then((r) => r.data),
    enabled: !!deptId,
  })

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

export const useDashboardCounting = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: dashboardKeys.counting(deptId ?? ''),
    queryFn: () => getDashboardCountingAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
