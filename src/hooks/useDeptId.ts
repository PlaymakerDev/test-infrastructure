"use client"
import { createContext, useContext } from 'react'
import { useSearchParams } from 'next/navigation'

/** Default department ID — falls back to dept 50 (used as the demo default
 *  in `drr-cm-fe`) when the URL query is missing. Allows direct navigation
 *  to /admin/traffic-signal without manually appending ?dept_id=. */
const DEFAULT_DEPT_ID = '50'

/** Optional override context. When a Provider is set higher in the tree,
 *  `useDeptId()` returns the Provider's value instead of reading the URL.
 *  Used by the dashboard so click/pan can rescope its cards in place
 *  without touching the URL — otherwise Next.js's `router.replace`
 *  remounts the entire map (`BaseMap` recreates the Mapbox instance),
 *  causing a jarring flicker + view reset every time. On pages that
 *  don't wrap in this Provider, the default `null` falls through to URL
 *  reading (unchanged behavior). */
export const DeptIdOverrideContext = createContext<string | null>(null)

/** Returns the department ID.
 *  - If a `DeptIdOverrideContext.Provider` sits above this call, its value
 *    wins (dashboard broadcasts pan-updated dept scope this way).
 *  - Else falls back to the URL query (`?dept_id=`).
 *  - Else `DEFAULT_DEPT_ID` (so direct navigation without a param still works). */
export const useDeptId = (): string => {
  const override = useContext(DeptIdOverrideContext)
  const params = useSearchParams()
  if (override !== null) return override
  return params.get('dept_id') ?? DEFAULT_DEPT_ID
}
