"use client"
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  locationContent: LocationContent
  setLocationContent: React.Dispatch<React.SetStateAction<LocationContent>>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export interface MenuContent {
  is_current: boolean
  path: string
}

export interface LocationContent {
  dashboard: MenuContent
  cctv: MenuContent
  traffic_volume: MenuContent
  incident_detection: MenuContent
  traffic_signal: MenuContent
  crosswalk: MenuContent
  traffic_lighting: MenuContent
  vms: MenuContent
  bridge_lighting: MenuContent
  tunnel: MenuContent
  tracking: MenuContent
  control_vms: MenuContent
  statistic: MenuContent
  maintenance: MenuContent
  settings: MenuContent
  smart_search: MenuContent
}

export const INIT_LOCATION_CONTENT: LocationContent = {
  dashboard: { is_current: false, path: '/admin/dashboard' },
  cctv: { is_current: false, path: '/admin/cctv' },
  traffic_volume: { is_current: false, path: '/admin/traffic-volume' },
  incident_detection: { is_current: false, path: '/admin/incident-detection' },
  traffic_signal: { is_current: false, path: '/admin/traffic-signal' },
  crosswalk: { is_current: false, path: '/admin/crosswalk' },
  traffic_lighting: { is_current: false, path: '/admin/traffic-lighting' },
  vms: { is_current: false, path: '/admin/vms' },
  bridge_lighting: { is_current: false, path: '/admin/bridge-lighting' },
  tunnel: { is_current: false, path: '/admin/tunnel' },
  tracking: { is_current: false, path: '/admin/tracking' },
  control_vms: { is_current: false, path: '/admin/control-vms' },
  statistic: { is_current: false, path: '/admin/statistic' },
  maintenance: { is_current: false, path: '/admin/maintenance' },
  settings: { is_current: false, path: '/admin/settings' },
  smart_search: { is_current: false, path: '/admin/smart-search' }
}

export const PageContext = createContext<ContextProps | null>(null)

export const PageProvider = (props: PageProviderProps) => {
  const { children } = props
  // IS CONTENT SHOW
  const [locationContent, setLocationContent] = useState<LocationContent>(INIT_LOCATION_CONTENT)

  return (
    <PageContext.Provider
      value={{
        locationContent,
        setLocationContent
      }}
    >
      {children}
    </PageContext.Provider>
  )
}

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within an PageProvider");
  }
  return context;
};
