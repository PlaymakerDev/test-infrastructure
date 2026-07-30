"use client"
import { useMemo } from 'react'
import { useIncidentCentralList } from '@/hooks/queries/incident-detection'
import type { RouteItem, MapMarkerItem } from './routeItems'

// The backend has been observed returning the same solution twice within one
// department's `solutions` array (same solution_id, e.g. id 964 under
// ขทช.นครราชสีมา) — without this, that duplicate double-counts into
// totalCount/onlineCount/notiTotal AND produces a React "duplicate key"
// crash in IncidentDetailSidebar's `sub.detail.map(d => <div key={dKey}>)`.
// Dedupe defensively, keeping the first occurrence.
const dedupeSolutions = <T extends { solution: { id: number | string } }>(solutions: T[]): T[] => {
  const seen = new Set<number | string>()
  return solutions.filter((sol) => {
    if (seen.has(sol.solution.id)) return false
    seen.add(sol.solution.id)
    return true
  })
}

// dept_id=0 is the "all departments" aggregate (same convention as
// statistics/overall's TOP_POWER_ROADS_DEPT_ID) — paired with scope=all so
// the endpoint returns every department's data instead of just dept 0's own.
const ALL_DEPARTMENTS_ID = 0

export interface LiveIncidentRouteData {
  /** ค้นหาสายทาง tree (bureau → แขวง → solution) for the search list. */
  routeItems: RouteItem[]
  /** One real map point PER SOLUTION (its own geometry_point), decoupled
   *  from the search-list's coarser bureau grouping — a bureau can own
   *  solutions scattered across many different locations. */
  markerItems: MapMarkerItem[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
}

/** ค้นหาสายทาง + map markers — both from the SAME GET
 *  /analytic/departments/0/overview/central/list?scope=all call. Shared by
 *  the overview map (IncidentSection) and the detail-page sidebar
 *  (IncidentDetailSidebar) so all three always agree on the same live data.
 *
 *  `dateRange` bounds each solution's `noti_count` (the number shown on
 *  each marker/cluster) — pass the same range used for the page's other
 *  period-scoped cards. Omit for the default today-00:00→now window.
 *  Passing a different range is a genuine TanStack Query cache key change
 *  (also the backend's own Redis cache key), so it refetches automatically
 *  — no manual refetch() needed. */
export function useLiveIncidentRouteItems(dateRange?: { start_date?: string; end_date?: string }): LiveIncidentRouteData {
  const centralListQuery = useIncidentCentralList(ALL_DEPARTMENTS_ID, { scope: 'all', ...dateRange })
  const centralList = centralListQuery.data

  const routeItems = useMemo<RouteItem[]>(() => (centralList ?? []).map((bureau) => {
    let onlineCount = 0
    let totalCount = 0
    let notiTotal = 0
    let lngLat: [number, number] | null = null

    const sub3 = bureau.sub_department.map((dept) => {
      const solutions = dedupeSolutions(dept.solutions)
      // `id` keeps the detail-page nav URL short (`?detail=<solution_id>`)
      // instead of URL-encoding the whole Thai label.
      const detail = solutions.map((sol) => {
        const isOnline = (sol.camera.online_count ?? (sol.camera.total - (sol.camera.offline_count ?? 0))) > 0
        return {
          label: `${sol.road.code_name} - ${sol.solution.solution_name}`,
          id: sol.solution.id,
          // The shared ค้นหาสายทาง list UI (StatisticsMapPanel) only reads
          // `connected` for the per-device icon, falling back to the parent
          // แขวง's own aggregate when it's missing — `is_online` alone (as
          // this was before) left every device in a mixed แขวง showing the
          // SAME icon regardless of its own real status. Alert/Status's
          // adapters already set both; mirror that here.
          connected: isOnline,
          is_online: isOnline,
          is_warranty: sol.is_warranty,
          projectId: sol.project.id,
          roadId: sol.road.id,
        }
      })
      let deptConnected = false
      // Per-แขวง tallies — back the sub-level online/total count + noti badge
      // (same aggregation the bureau does, one level down).
      let deptOnline = 0
      let deptTotal = 0
      let deptNoti = 0

      for (const sol of solutions) {
        totalCount += 1
        deptTotal += 1
        notiTotal += sol.noti_count ?? 0
        deptNoti += sol.noti_count ?? 0
        const online = sol.camera.online_count ?? (sol.camera.total - (sol.camera.offline_count ?? 0))
        if (online > 0) {
          onlineCount += 1
          deptOnline += 1
          deptConnected = true
        }
        if (!lngLat && Array.isArray(sol.geometry_point) && sol.geometry_point.length === 2) {
          lngLat = sol.geometry_point
        }
      }

      return { label: dept.department_short_name, detail, connected: deptConnected, count: `${deptOnline}/${deptTotal}`, notiTotal: deptNoti }
    })

    return {
      id: bureau.department_id,
      name: bureau.department_short_name,
      count: `${onlineCount}/${totalCount}`,
      lngLat,
      sub3,
      notiTotal,
    }
  }), [centralList])

  const markerItems = useMemo<MapMarkerItem[]>(() => {
    const items: MapMarkerItem[] = []
    for (const bureau of centralList ?? []) {
      for (const dept of bureau.sub_department) {
        for (const sol of dedupeSolutions(dept.solutions)) {
          const noti = sol.noti_count ?? 0
          // Incident map plots event hotspots — a solution with 0 events today
          // is not a hotspot, so it's omitted from the map entirely (no "0"
          // dot / cluster). The search list still lists it (0 shown there).
          if (noti > 0 && Array.isArray(sol.geometry_point) && sol.geometry_point.length === 2) {
            const online = sol.camera.online_count ?? (sol.camera.total - (sol.camera.offline_count ?? 0))
            items.push({
              routeKey: String(bureau.department_id),
              detailKey: String(sol.solution.id),
              lngLat: sol.geometry_point,
              // Number on the pin = event (noti) count; colour = the solution's
              // online/offline status (yellow online / red offline), uniform
              // with the alert + status maps.
              count: noti,
              offline: !(online > 0),
            })
          }
        }
      }
    }
    return items
  }, [centralList])

  return {
    routeItems,
    markerItems,
    isLoading: centralListQuery.isLoading,
    isFetching: centralListQuery.isFetching,
    isError: centralListQuery.isError,
    refetch: centralListQuery.refetch,
  }
}
