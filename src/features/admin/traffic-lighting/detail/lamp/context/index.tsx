"use client"
import { createContext, useContext } from 'react'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

/** Lamp-only context — fully decoupled from the phase detail context.
 *  No tabs, no layout switch, no imei-driven API calls. */
export interface LampContextProps {
  project: TrafficLightingProject
}

export interface LampProviderProps extends LampContextProps {
  children: React.ReactNode
}

export const LampContext = createContext<LampContextProps | null>(null)

export const LampProvider = ({ children, project }: LampProviderProps) => (
  <LampContext.Provider value={{ project }}>
    {children}
  </LampContext.Provider>
)

export const useLampContext = () => {
  const ctx = useContext(LampContext)
  if (!ctx) throw new Error('useLampContext must be used within a LampProvider')
  return ctx
}
