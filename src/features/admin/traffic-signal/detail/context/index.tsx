"use client"
import { createContext, useContext } from 'react'
import type { TrafficSignalProject } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

export interface ContextProps {
  /** Currently-viewed signal project (resolved by id at the Screen). */
  project: TrafficSignalProject
}

export interface DetailProviderProps {
  children: React.ReactNode
  project: TrafficSignalProject
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = ({ children, project }: DetailProviderProps) => {
  return (
    <DetailContext.Provider value={{ project }}>
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
