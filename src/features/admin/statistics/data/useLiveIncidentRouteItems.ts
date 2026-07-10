"use client"
import { useMemo } from 'react'
import { useIncidentCentralList } from '@/hooks/queries/incident-detection'
import type { RouteItem, MapMarkerItem } from './routeItems'

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
}

/** ค้นหาสายทาง + map markers — both from the SAME GET
 *  /analytic/departments/0/overview/central/list?scope=all call. Shared by
 *  the overview map (IncidentSection) and the detail-page sidebar
 *  (IncidentDetailSidebar) so all three always agree on the same live data. */
export function useLiveIncidentRouteItems(): LiveIncidentRouteData {
  const { data: centralList } = useIncidentCentralList(ALL_DEPARTMENTS_ID, 'all')

  const routeItems = useMemo<RouteItem[]>(() => (centralList ?? []).map((bureau) => {
    let onlineCount = 0
    let totalCount = 0
    let notiTotal = 0
    let lngLat: [number, number] | null = null

    const sub3 = bureau.sub_department.map((dept) => {
      // `id` keeps the detail-page nav URL short (`?detail=<solution_id>`)
      // instead of URL-encoding the whole Thai label.
      const detail = dept.solutions.map((sol) => ({
        label: `${sol.road.code_name} - ${sol.solution.solution_name}`,
        id: sol.solution.id,
      }))
      let deptConnected = false

      for (const sol of dept.solutions) {
        totalCount += 1
        notiTotal += sol.noti_count ?? 0
        const online = sol.camera.online_count ?? (sol.camera.total - (sol.camera.offline_count ?? 0))
        if (online > 0) {
          onlineCount += 1
          deptConnected = true
        }
        if (!lngLat && Array.isArray(sol.geometry_point) && sol.geometry_point.length === 2) {
          lngLat = sol.geometry_point
        }
      }

      return { label: dept.department_short_name, detail, connected: deptConnected }
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
        for (const sol of dept.solutions) {
          if (Array.isArray(sol.geometry_point) && sol.geometry_point.length === 2) {
            items.push({
              routeKey: String(bureau.department_id),
              detailKey: String(sol.solution.id),
              lngLat: sol.geometry_point,
              count: sol.noti_count ?? 0,
            })
          }
        }
      }
    }
    return items
  }, [centralList])

  return { routeItems, markerItems }
}
