import ApiService from '../ApiService'
import type {
  APIResponseDashboardCctvUptime,
  APIResponseDashboardVmsUptime,
  APIResponseDashboardLightingUptime,
  APIResponseDashboardPosition,
  APIResponseDashboardAnalytic,
  APIResponseDashboardTraffic,
  APIResponseDashboardCounting,
  DashboardBucketType,
} from '@/types/dashboard/api'

// Dashboard composes across feature namespaces (no single `/dashboard` route).
// Each function targets the same endpoint the old web (drr-cm-fe) consumed,
// verified live against https://its.drr.go.th/api-v2 on 2026-06-24.

// ── Uptime % per system ──────────────────────────────────────────────────────

export const getDashboardCctvUptimeAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseDashboardCctvUptime>({
    url: `/cctv/departments/${deptId}/cameras/uptime-statistics`,
    method: 'GET',
  })

export const getDashboardVmsUptimeAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseDashboardVmsUptime>({
    url: `/vms/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
  })

export const getDashboardLightingUptimeAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseDashboardLightingUptime>({
    url: `/lighting/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
  })

// ── Map markers (all systems) ────────────────────────────────────────────────

export const getDashboardPositionAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseDashboardPosition>({
    url: `/manage/solution/${deptId}/position`,
    method: 'GET',
  })

// ── Bucketed event counts (incident/analytic — drives AccidentChart) ─────────

export const getDashboardAnalyticAPI = (
  deptId: string | number,
  type: DashboardBucketType = 'yearly',
) =>
  ApiService.fetchData<APIResponseDashboardAnalytic>({
    url: `/analytic/details/${deptId}/dashboard`,
    method: 'GET',
    params: { type },
  })

// ── Top solutions by traffic volume (informational, not wired yet) ───────────

export const getDashboardTrafficAPI = (
  deptId: string | number,
  type: DashboardBucketType = 'yearly',
  limit = 5,
) =>
  ApiService.fetchData<APIResponseDashboardTraffic>({
    url: `/traffic/${deptId}/dashboard`,
    method: 'GET',
    params: { type, limit },
  })

// ── Counting — vehicle counts (rose chart) + hourly buckets (peak hour) ──────

export const getDashboardCountingAPI = (deptId: string | number) =>
  ApiService.fetchData<APIResponseDashboardCounting>({
    url: `/counting/${deptId}/dashboard`,
    method: 'GET',
  })
