"use client"
import { useMemo } from 'react'
import { useIotStatus } from '@/hooks/queries/incident-detection'
import type { RouteItem, MapMarkerItem } from './routeItems'

const ALL_DEPARTMENTS_ID = 0

export interface LiveAlertRouteData {
  /** ค้นหาสายทาง tree (bureau → แขวง → road/device) for the search list. */
  routeItems: RouteItem[]
  /** One real map point PER DEVICE (its own geometry_point), decoupled from
   *  the search-list's coarser bureau grouping — a bureau can own devices
   *  scattered across many different roads. */
  markerItems: MapMarkerItem[]
}

/** Alert "ค้นหาสายทาง" — maps the iot-status tree into RouteItem[] so the
 *  existing StatisticsMapPanel search list can render real online/offline
 *  counts without any UI change, and into MapMarkerItem[] (one per device
 *  geometry_point) for the map.
 *
 *  `start_date`/`end_date` bound each device's noti_count (also part of the
 *  backend's Redis cache key) — omit for the default today-00:00→now window. */
export function useLiveAlertRouteItems(dateRange?: { start_date?: string; end_date?: string }): LiveAlertRouteData {
  const { data: bureaus } = useIotStatus(ALL_DEPARTMENTS_ID, { scope: 'all', ...dateRange })

  const routeItems = useMemo<RouteItem[]>(() => {
    return (bureaus ?? []).map((bureau) => {
      let lngLat: [number, number] | null = null

      const sub3 = bureau.sub_department.map((dept) => {
        const detail = dept.roads.flatMap((road) =>
          road.devices.map((dev) => {
            if (!lngLat && Array.isArray(dev.geometry_point) && dev.geometry_point.length === 2) {
              lngLat = dev.geometry_point
            }
            return {
              label: `${road.road_code} - ${dev.solution_name}`,
              id: dev.imei,
              connected: dev.is_online,
              is_online: dev.is_online,
              line_check_fail: dev.line_check_fail,
              circuit_fail: dev.circuit_fail,
              volt_amp_fail: dev.volt_amp_fail,
              // No project_id in this API (unlike incident-detection's
              // central-list) — only road_id is available, so ProjectInfoModal
              // opens with department info but "-" for project-specific fields.
              roadId: road.road_id,
            }
          }),
        )
        const connected = dept.online > 0
        return { label: dept.department_short_name, detail, connected, count: `${dept.offline}/${dept.online}` }
      })

      return {
        id: bureau.department_id,
        name: bureau.department_short_name,
        count: `${bureau.offline}/${bureau.online}`,
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
          for (const dev of road.devices) {
            if (Array.isArray(dev.geometry_point) && dev.geometry_point.length === 2) {
              items.push({
                routeKey: String(bureau.department_id),
                detailKey: dev.imei,
                lngLat: dev.geometry_point,
                // 1 install point per device — clusters sum to the total
                // device count in that area (matches the ค้นหาสายทาง
                // sidebar's online/offline install-point tally, NOT
                // noti_count / alert counts).
                count: 1,
                offline: !dev.is_online,
              })
            }
          }
        }
      }
    }
    return items
  }, [bureaus])

  return { routeItems, markerItems }
}
