"use client"
import { createContext, useContext } from 'react'
import { useSearchParams } from 'next/navigation'

/** Optional override context — the สายทาง counterpart of
 *  `DeptIdOverrideContext`. The dashboard owns a live road scope (seeded from
 *  `?road_id=`, moved by a MapSearchBox pick, cleared from the breadcrumb) and
 *  broadcasts it here so every card refetches WITHOUT a `router.replace`, which
 *  would remount BaseMap and flicker the map.
 *
 *  `undefined` = no Provider above → fall back to reading the URL.
 *  `null`      = a Provider says "no road scope" (whole dept). */
export const RoadIdOverrideContext = createContext<string | null | undefined>(undefined)

/** Returns the active สายทาง id, or `null` when nothing is road-scoped.
 *  Pass it explicitly into the query hooks that support it — do NOT read it
 *  inside the hooks, because the map's own marker pool must stay dept-wide
 *  (it filters client-side so clearing the road needs no refetch). */
export const useRoadId = (): string | null => {
  const override = useContext(RoadIdOverrideContext)
  const params = useSearchParams()
  if (override !== undefined) return override
  return params.get('road_id')
}
