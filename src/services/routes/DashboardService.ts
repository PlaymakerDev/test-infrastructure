import ApiService from '../ApiService'
import { centralScope } from './scopeParam'
import type {
  APIResponseDashboardCctvUptime,
  APIResponseDashboardVmsUptime,
  APIResponseDashboardLightingUptime,
  APIResponseDashboardTrafficUptime,
  APIResponseDashboardWimUptime,
  APIResponseDashboardCrosswalkUptime,
  APIResponseDashboardTunnelUptime,
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

// `scope=all` per the URL's intent, on every uptime endpoint (BE confirmed
// support across all 7 features, 2026-07-13). The dashboard hook passes the
// flag EXPLICITLY (from the reactive useScopeAll) so key and request always
// agree; when omitted, falls back to reading the current URL.
const scopeParams = (deptId: string | number, scopeAll?: boolean) =>
  scopeAll === undefined ? centralScope(deptId) : scopeAll ? ({ scope: 'all' } as const) : undefined

/** `&road_id=` — narrows a dept-scoped endpoint to ONE สายทาง. EVERY dashboard
 *  endpoint below now forwards it (one pattern, no per-endpoint special cases),
 *  but BE honours it on only some of them today.
 *
 *  Probed live 2026-08-10, dept 50 / road 1809 — each ✅ cross-checked against
 *  that road's device counts in `/position`:
 *    ✅ `/manage/solution/{dept}/position`
 *    ✅ vms · lighting · traffic · crosswalk · tunnel  `/overview/uptime-statistics`
 *    ❌ `/cctv/departments/{dept}/cameras/uptime-statistics` (stayed 941 cameras)
 *    ❌ `/wim/…/uptime-statistics`
 *    ❌ `/analytic/details/{dept}/dashboard`  (AccidentChart, Notification)
 *    ❌ `/counting/{dept}/dashboard`          (VehicleRatioChart, TrafficStat)
 *    ❌ `/traffic/{dept}/dashboard`
 *  The ❌ set ignores the param silently — no alternate spelling works either
 *  (`road`, `road_ids`, `roads`, `road_code`, `solution_road_id` all probed). So
 *  for those the request is road-scoped while the RESPONSE is still dept-wide;
 *  the cards show it unannotated (a `(ไม่กรองสายทาง)` caption was tried and
 *  dropped 2026-08-10 by request). Once BE ships support the numbers start
 *  filtering on their own — no request change needed, just re-probe and update
 *  this list. */
const roadParam = (roadId?: string | number | null) =>
  roadId != null && roadId !== '' ? ({ road_id: roadId } as const) : undefined

export const getDashboardCctvUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ❌ ignored by BE today — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardCctvUptime>({
    url: `/cctv/departments/${deptId}/cameras/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

export const getDashboardVmsUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ✅ road_id supported here — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardVmsUptime>({
    url: `/vms/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

export const getDashboardLightingUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ✅ road_id supported here — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardLightingUptime>({
    url: `/lighting/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

// Traffic / WIM / Crosswalk / Tunnel — same `/overview/uptime-statistics`
// pattern as vms + lighting (verified live 2026-07-05, response shape identical
// with the key named after the feature).
export const getDashboardTrafficUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ✅ road_id supported here — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardTrafficUptime>({
    url: `/traffic/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

export const getDashboardWimUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ❌ ignored by BE today — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardWimUptime>({
    url: `/wim/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

export const getDashboardCrosswalkUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ✅ road_id supported here — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardCrosswalkUptime>({
    url: `/crosswalk/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

export const getDashboardTunnelUptimeAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ✅ road_id supported here — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardTunnelUptime>({
    url: `/tunnel/departments/${deptId}/overview/uptime-statistics`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

// ── Map markers (all systems) ────────────────────────────────────────────────

/** ✅ `roadId` narrows the payload to ONE สายทาง (dept 50 `?scope=all` = 250
 *  rows / 23 roads → `&road_id=1809` = 93 rows / 1 road, and `centroid` comes
 *  back as that road's own centre). It filters WITHIN the dept path segment, so
 *  a road belonging to another dept returns `{locations: [], centroid: null}` —
 *  pass dept 0 to look one up nationwide. Backs both the `?road_id=` landing's
 *  fly-to target and every road-scoped card count; the map's marker pool still
 *  fetches dept-wide and filters client-side (see ReactMap). */
export const getDashboardPositionAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardPosition>({
    url: `/manage/solution/${deptId}/position`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

// ── Bucketed event counts (incident/analytic — drives AccidentChart) ─────────

export const getDashboardAnalyticAPI = (
  deptId: string | number,
  type: DashboardBucketType = 'yearly',
  scopeAll?: boolean,
  /** ❌ ignored by BE today — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardAnalytic>({
    url: `/analytic/details/${deptId}/dashboard`,
    method: 'GET',
    params: { type, ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })

// ── Top solutions by traffic volume (informational, not wired yet) ───────────

export const getDashboardTrafficAPI = (
  deptId: string | number,
  type: DashboardBucketType = 'yearly',
  limit = 5,
  /** ❌ ignored by BE today — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardTraffic>({
    url: `/traffic/${deptId}/dashboard`,
    method: 'GET',
    params: { type, limit, ...roadParam(roadId) },
  })

// ── Counting — vehicle counts (rose chart) + hourly buckets (peak hour) ──────

export const getDashboardCountingAPI = (
  deptId: string | number,
  scopeAll?: boolean,
  /** ❌ ignored by BE today — see roadParam. */
  roadId?: string | number | null,
) =>
  ApiService.fetchData<APIResponseDashboardCounting>({
    url: `/counting/${deptId}/dashboard`,
    method: 'GET',
    params: { ...scopeParams(deptId, scopeAll), ...roadParam(roadId) },
  })
