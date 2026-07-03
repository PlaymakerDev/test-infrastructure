"use client"
import { createContext, useContext } from 'react'
import type { CrosswalkLocation } from '@/types/crosswalk/overview-api'

export interface ContextProps {
  /** Solution id from the URL — used as the cache key + downstream API arg. */
  id: string
  /** The single location for this id (from overview API filtered by
   *  solution_id). `null` while loading or when the API returns no match. */
  location: CrosswalkLocation | null
}

export interface DetailProviderProps {
  children: React.ReactNode
  id: string
  location: CrosswalkLocation | null
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = ({ children, id, location }: DetailProviderProps) => {
  return (
    <DetailContext.Provider value={{ id, location }}>
      {children}
    </DetailContext.Provider>
  )
}

export const useDetailContext = () => {
  const context = useContext(DetailContext)
  if (!context) {
    throw new Error('useDetailContext must be used within a DetailProvider')
  }
  return context
}
