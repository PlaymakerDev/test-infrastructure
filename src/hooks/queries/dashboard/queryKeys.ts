// Query key factory for Dashboard hooks.
import type { DashboardBucketType } from '@/types/dashboard/api'

export const dashboardKeys = {
  all: ['dashboard'] as const,

  uptime: (feature: 'cctv' | 'vms' | 'lighting', deptId: string | number) =>
    [...dashboardKeys.all, 'uptime', feature, deptId] as const,

  position: (deptId: string | number) =>
    [...dashboardKeys.all, 'position', deptId] as const,

  analytic: (deptId: string | number, type: DashboardBucketType) =>
    [...dashboardKeys.all, 'analytic', deptId, type] as const,

  traffic: (deptId: string | number, type: DashboardBucketType, limit: number) =>
    [...dashboardKeys.all, 'traffic', deptId, type, limit] as const,

  counting: (deptId: string | number) =>
    [...dashboardKeys.all, 'counting', deptId] as const,
} as const
