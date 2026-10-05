"use client"
import React, { createContext, useContext, useMemo } from 'react'
import { useLPRPoints } from '@/hooks/queries/lpr'
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'

export type LPRDetailTab = 'OVERALL' | 'DETECTIONS'

interface DetailContextValue {
  solutionId: string
  departmentId: string
  roadId: string
  point: LPRInstallPoint | null
  isLoading: boolean
  currentTab: LPRDetailTab
  setCurrentTab: (tab: LPRDetailTab) => void
}

const DetailContext = createContext<DetailContextValue>({
  solutionId: '',
  departmentId: '',
  roadId: '',
  point: null,
  isLoading: false,
  currentTab: 'OVERALL',
  setCurrentTab: () => { },
})

interface DetailProviderProps {
  children: React.ReactNode
  /** solution_id from the route (`/admin/lpr/detail/[id]`). */
  solutionId: string
  /** `dept_id` search param — '' when the page was opened without it. */
  departmentId: string
  /** `road_id` search param — '' when the page was opened without it. */
  roadId: string
  /** Owned by the screen (above this provider) so both the tab UI and any
   *  section nested under it can read/switch tabs via context instead of
   *  prop-drilling down through `LPRDetailContent`. */
  currentTab: LPRDetailTab
  setCurrentTab: (tab: LPRDetailTab) => void
}

/** Detail-page context: resolves the current install-point from the
 *  `solutionId` prop (route id = solution_id) by filtering the cached
 *  /lpr/points list. `solutionId` / `departmentId` / `roadId` are handed in by
 *  the screen — the route only has `[id]`; dept/road ride the query string, so
 *  reading them via `useParams()` here always came back empty.
 *  Every section reads from here rather than each fetching independently,
 *  so the header + map + KPIs share one cache entry. */
export const DetailProvider: React.FC<DetailProviderProps> = ({
  children,
  solutionId,
  departmentId,
  roadId,
  currentTab,
  setCurrentTab,
}) => {
  const { data: points, isLoading } = useLPRPoints(false)

  const point = useMemo(() => {
    if (!points || !solutionId) return null
    return points.find((p) => String(p.solution_id) === solutionId) ?? null
  }, [points, solutionId])

  const value = useMemo(
    () => ({ solutionId, departmentId, roadId, point, isLoading, currentTab, setCurrentTab }),
    [solutionId, departmentId, roadId, point, isLoading, currentTab, setCurrentTab],
  )

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>
}

export const useLPRDetailContext = () => useContext(DetailContext)
