"use client"
import React, { createContext, useContext, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useLPRPoints } from '@/hooks/queries/lpr'
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'

interface DetailContextValue {
  solutionId: string
  point: LPRInstallPoint | null
  isLoading: boolean
}

const DetailContext = createContext<DetailContextValue>({
  solutionId: '',
  point: null,
  isLoading: false,
})

/** Detail-page context: resolves the current install-point from the URL
 *  (params.id = solution_id) by filtering the cached /lpr/points list.
 *  Every section reads from here rather than each fetching independently,
 *  so the header + map + KPIs share one cache entry. */
export const DetailProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const params = useParams()
  const solutionId = String(Array.isArray(params.id) ? params.id[0] : params.id ?? '')
  const { data: points, isLoading } = useLPRPoints()

  const point = useMemo(() => {
    if (!points || !solutionId) return null
    return points.find((p) => String(p.solution_id) === solutionId) ?? null
  }, [points, solutionId])

  const value = useMemo(
    () => ({ solutionId, point, isLoading }),
    [solutionId, point, isLoading],
  )

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>
}

export const useLPRDetailContext = () => useContext(DetailContext)
