"use client"
import { createContext, useContext, useState } from 'react'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

export type TrafficLightingDetailTab = 'OVERVIEW' | 'IOT_MONITOR' | 'SUMMARY'

export interface ContextProps {
  project: TrafficLightingProject
  currentTab: TrafficLightingDetailTab
  setCurrentTab: (value: TrafficLightingDetailTab) => void
}

export interface DetailProviderProps {
  children: React.ReactNode
  project: TrafficLightingProject
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = ({ children, project }: DetailProviderProps) => {
  const [currentTab, setCurrentTab] = useState<TrafficLightingDetailTab>('OVERVIEW')

  return (
    <DetailContext.Provider value={{ project, currentTab, setCurrentTab }}>
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
