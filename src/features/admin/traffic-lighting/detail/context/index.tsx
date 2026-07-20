"use client"
import { createContext, useContext, useMemo, useState } from 'react'
import { useLightingDeviceDetails } from '@/hooks/queries/lighting'
import type { DetailsResponse } from '@/types/lighting'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

export type TrafficLightingDetailTab = 'OVERVIEW' | 'IOT_MONITOR' | 'SUMMARY'

export interface ContextProps {
  project: TrafficLightingProject
  imei: string
  currentTab: TrafficLightingDetailTab
  setCurrentTab: (value: TrafficLightingDetailTab) => void
  device: DetailsResponse | null
  deviceLoaded: boolean
}

export interface DetailProviderProps {
  children: React.ReactNode
  project: TrafficLightingProject
  imei: string
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = ({ children, project, imei }: DetailProviderProps) => {
  const [currentTab, setCurrentTab] = useState<TrafficLightingDetailTab>('OVERVIEW')

  const deviceQuery = useLightingDeviceDetails(imei)
  const device = deviceQuery.data ?? null
  // `!isLoading` covers all three of the old flag's cases: no imei (query
  // disabled → isLoading false → "loaded" immediately), first fetch in
  // flight (true → not loaded), and settled success/error (false → loaded).
  const deviceLoaded = !deviceQuery.isLoading
  const resolvedProject = useMemo<TrafficLightingProject>(() => {
    if (!device) return project
    const phase = device.phase === 1 || device.phase === 3 ? device.phase : null
    return {
      ...project,
      imei: imei || project.imei,
      connection: device.is_online ? 'online' : 'offline',
      phase,
      circuitStatus: device.has_broken_wire ? 'abnormal' : 'normal',
    }
  }, [device, imei, project])

  return (
    <DetailContext.Provider value={{ project: resolvedProject, imei, currentTab, setCurrentTab, device, deviceLoaded }}>
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
