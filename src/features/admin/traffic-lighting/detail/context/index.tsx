"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import { getLightingDeviceDetailsAPI } from '@/services/routes/LightingService'
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
  const [device, setDevice] = useState<DetailsResponse | null>(null)
  const [deviceLoaded, setDeviceLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (!imei) {
      setDeviceLoaded(true)
      return
    }
    getLightingDeviceDetailsAPI(imei)
      .then((res) => { if (active) setDevice(res.data ?? null) })
      .catch((err) => console.error('imei/details failed:', err))
      .finally(() => { if (active) setDeviceLoaded(true) })
    return () => { active = false }
  }, [imei])

  return (
    <DetailContext.Provider value={{ project, imei, currentTab, setCurrentTab, device, deviceLoaded }}>
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
