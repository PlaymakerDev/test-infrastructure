"use client"
import { RoadItem } from '@/components/list';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  route: RoadItem;
  setRoute: React.Dispatch<React.SetStateAction<RoadItem>>;
  licenseOpen: boolean;
  setLicenseOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const GPSContext = createContext<ContextProps | null>(null)

export const GPSProvider = (props: PageProviderProps) => {
  const { children } = props
  const [route, setRoute] = useState<RoadItem>({
    id: "",
    road_code: "",
    road_name: "",
    vehicle_count: 0
  })
  const [licenseOpen, setLicenseOpen] = useState(false)

  return (
    <GPSContext.Provider
      value={{
        route,
        setRoute,
        licenseOpen,
        setLicenseOpen,
      }}
    >
      {children}
    </GPSContext.Provider>
  )
}

export const useGPSContext = () => {
  const context = useContext(GPSContext);
  if (!context) {
    throw new Error("useGPSContext must be used within a GPSProvider");
  }
  return context;
};
