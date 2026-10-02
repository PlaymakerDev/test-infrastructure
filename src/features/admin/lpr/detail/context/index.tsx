"use client"
import React, { createContext, useContext, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useLPRPoints } from '@/hooks/queries/lpr'
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'

export type LPRDetailTab = 'OVERALL' | 'DETECTIONS'

interface DetailContextValue {
  solutionId: string
  point: LPRInstallPoint | null
  isLoading: boolean
  currentTab: LPRDetailTab
  setCurrentTab: (tab: LPRDetailTab) => void
}

const DetailContext = createContext<DetailContextValue>({
  solutionId: '',
  point: null,
  isLoading: false,
  currentTab: 'OVERALL',
  setCurrentTab: () => { },
})

interface DetailProviderProps {
  children: React.ReactNode
  /** Owned by the screen (above this provider) so both the tab UI and any
   *  section nested under it can read/switch tabs via context instead of
   *  prop-drilling down through `LPRDetailContent`. */
  currentTab: LPRDetailTab
  setCurrentTab: (tab: LPRDetailTab) => void
}

/** Detail-page context: resolves the current install-point from the URL
 *  (params.id = solution_id) by filtering the cached /lpr/points list.
 *  Every section reads from here rather than each fetching independently,
 *  so the header + map + KPIs share one cache entry. */
export const DetailProvider: React.FC<DetailProviderProps> = ({
  children,
  currentTab,
  setCurrentTab,
}) => {
  const params = useParams()
  const solutionId = String(Array.isArray(params.id) ? params.id[0] : params.id ?? '')
  const { data: points, isLoading } = useLPRPoints(false)

  const point = useMemo(() => {
    if (!points || !solutionId) return null
    return points.find((p) => String(p.solution_id) === solutionId) ?? null
  }, [points, solutionId])

  const value = useMemo(
    () => ({ solutionId, point, isLoading, currentTab, setCurrentTab }),
    [solutionId, point, isLoading, currentTab, setCurrentTab],
  )

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>
}

export const useLPRDetailContext = () => useContext(DetailContext)
