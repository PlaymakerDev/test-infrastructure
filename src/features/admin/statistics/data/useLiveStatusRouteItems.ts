"use client"
import { useMemo } from 'react'
import { useVMSDepartments } from '@/features/admin/control-vms/overall/hooks/useVMSDepartments'
import type { Road } from '@/types/control-vms/vms-api'
import type { RouteItem, MapMarkerItem } from './routeItems'

export interface LiveStatusTopEntry {
  name: string
  count: number
  percentage: number
}

export interface LiveStatusSummary {
  /** Total VMS install points across every bureau. */
  totalInstallPoints: number
  /** Bureau (สทช.) with the most install points. */
  topBureauByInstall: LiveStatusTopEntry | null
  /** Sum of `noti_count` across every bureau (rolled up by the backend). */
  totalNotiCount: number
  /** Bureau (สทช.) with the most notifications. */
  topBureauByNoti: LiveStatusTopEntry | null
  /** Count of sub-departments (ขทช.) with at least one notification. */
  departmentsWithNoti: number
  /** Sub-department (ขทช.) with the most notifications. */
  topSubDepartmentByNoti: LiveStatusTopEntry | null
  /** VMS currently online, across every bureau. */
  onlineCount: number
  onlinePercentage: number
}

export interface LiveStatusRouteData {
  /** ค้นหาสายทาง tree (bureau → แขวง → road/VMS) for the search list. */
  routeItems: RouteItem[]
  /** One real map point per VMS (its own lat/lng), decoupled from the
   *  search-list's coarser bureau grouping. */
  markerItems: MapMarkerItem[]
  /** Aggregate counts for the top-right stat cards. */
  summary: LiveStatusSummary
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
}

const countOnlineOffline = (roads: Road[]) => {
  let online = 0
  let offline = 0
  for (const road of roads) {
    for (const sol of road.solution) {
      if (sol.is_online) online++
      else offline++
    }
  }
  return { online, offline }
}

/** STATUS tab (สถานะและการปรับเปลี่ยนข้อความ) "ค้นหาสายทาง" — maps
 *  `GET /vms/settings/departments` into RouteItem[] (search list, online/
 *  offline counts derived from each VMS's `is_online`) and MapMarkerItem[]
 *  (one per VMS, using its own `latitude`/`longitude`).
 *
 *  `since` bounds each solution/department/bureau's `noti_count` (backend
 *  defaults to today 00:00 Asia/Bangkok when omitted). */
export function useLiveStatusRouteItems(since?: string): LiveStatusRouteData {
  const departmentsQuery = useVMSDepartments(since ? { since } : undefined)
  const bureausResponse = departmentsQuery.data
  const bureaus = bureausResponse?.data

  const routeItems = useMemo<RouteItem[]>(() => {
    return (bureaus ?? []).map((bureau) => {
      let lngLat: [number, number] | null = null

      const sub3 = bureau.sub_department.map((dept) => {
        const detail = dept.roads.flatMap((road) =>
          road.solution.map((sol) => {
            if (!lngLat && typeof sol.latitude === 'number' && typeof sol.longitude === 'number') {
              lngLat = [sol.longitude, sol.latitude]
            }
            return {
              label: `${road.road_code} - ${sol.solution_name}`,
              id: sol.vms_id,
              connected: sol.is_online,
              is_online: sol.is_online,
              roadId: road.road_id,
              projectId: sol.project?.id,
              anydesk: sol.anydesk,
              desktopScreen: sol.desktop_screen,
              solutionId: sol.solution_id,
            }
          }),
        )
        const { online, offline } = countOnlineOffline(dept.roads)
        return {
          label: dept.department_short_name,
          detail,
          connected: online > 0,
          count: `${online}/${online + offline}`,
          notiTotal: dept.noti_count,
        }
      })

      const { online, offline } = countOnlineOffline(bureau.sub_department.flatMap((d) => d.roads))

      return {
        id: bureau.department_id,
        name: bureau.department_short_name,
        count: `${online}/${online + offline}`,
        lngLat,
        sub3,
        notiTotal: bureau.noti_count,
      }
    })
  }, [bureaus])

  const markerItems = useMemo<MapMarkerItem[]>(() => {
    const items: MapMarkerItem[] = []
    for (const bureau of bureaus ?? []) {
      for (const dept of bureau.sub_department) {
        for (const road of dept.roads) {
          for (const sol of road.solution) {
            if (typeof sol.latitude === 'number' && typeof sol.longitude === 'number') {
              items.push({
                routeKey: String(bureau.department_id),
                detailKey: String(sol.vms_id),
                lngLat: [sol.longitude, sol.latitude],
                count: 1,
                offline: !sol.is_online,
              })
            }
          }
        }
      }
    }
    return items
  }, [bureaus])

  // Stat-card aggregates. VMS has notification logs (`noti_count`), not the
  // incident-domain event concept; StatusSection labels these values as
  // notifications so the UI matches the backend semantics.
  const summary = useMemo<LiveStatusSummary>(() => {
    const list = bureaus ?? []

    let totalInstallPoints = 0
    let onlineCount = 0
    let topBureauByInstall: LiveStatusTopEntry | null = null
    let topBureauByNoti: LiveStatusTopEntry | null = null
    let departmentsWithNoti = 0
    let topSubDepartmentByNoti: LiveStatusTopEntry | null = null

    for (const bureau of list) {
      const { online, offline } = countOnlineOffline(bureau.sub_department.flatMap((d) => d.roads))
      const installCount = online + offline
      totalInstallPoints += installCount
      onlineCount += online

      if (installCount > 0 && (!topBureauByInstall || installCount > topBureauByInstall.count)) {
        topBureauByInstall = { name: bureau.department_short_name, count: installCount, percentage: 0 }
      }
      if (bureau.noti_count > 0 && (!topBureauByNoti || bureau.noti_count > topBureauByNoti.count)) {
        topBureauByNoti = { name: bureau.department_short_name, count: bureau.noti_count, percentage: 0 }
      }
      for (const dept of bureau.sub_department) {
        if (dept.noti_count > 0) {
          departmentsWithNoti++
          if (!topSubDepartmentByNoti || dept.noti_count > topSubDepartmentByNoti.count) {
            topSubDepartmentByNoti = { name: dept.department_short_name, count: dept.noti_count, percentage: 0 }
          }
        }
      }
    }

    const totalNotiCount = list.reduce((sum, b) => sum + b.noti_count, 0)
    if (topBureauByInstall) topBureauByInstall.percentage = totalInstallPoints > 0 ? (topBureauByInstall.count / totalInstallPoints) * 100 : 0
    if (topBureauByNoti) topBureauByNoti.percentage = totalNotiCount > 0 ? (topBureauByNoti.count / totalNotiCount) * 100 : 0

    return {
      totalInstallPoints,
      topBureauByInstall,
      totalNotiCount,
      topBureauByNoti,
      departmentsWithNoti,
      topSubDepartmentByNoti,
      onlineCount,
      onlinePercentage: totalInstallPoints > 0 ? (onlineCount / totalInstallPoints) * 100 : 0,
    }
  }, [bureaus])

  return {
    routeItems,
    markerItems,
    summary,
    isLoading: departmentsQuery.isLoading,
    isFetching: departmentsQuery.isFetching,
    isError: departmentsQuery.isError,
    refetch: () => { void departmentsQuery.refetch() },
  }
}
