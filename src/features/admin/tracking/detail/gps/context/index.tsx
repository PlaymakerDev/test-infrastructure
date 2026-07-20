"use client"
import { RoadItem } from '@/components/list';
import { VehicleList } from '@/types/tracking/detail-gps-api';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  // MOCK DATA
  route: RoadItem;
  setRoute: React.Dispatch<React.SetStateAction<RoadItem>>;
  licenseOpen: boolean;
  setLicenseOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // API DATA
  selectRoute: VehicleList;
  setSelectRoute: React.Dispatch<React.SetStateAction<VehicleList>>;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const GPSContext = createContext<ContextProps | null>(null)

export const GPSProvider = (props: PageProviderProps) => {
  const { children } = props
  // MOCK DATA
  const [route, setRoute] = useState<RoadItem>({
    id: "",
    road_code: "",
    road_name: "",
    vehicle_count: 0
  })
  const [licenseOpen, setLicenseOpen] = useState(false)

  // API DATA
  const [selectRoute, setSelectRoute] = useState<VehicleList>({
    "latitude": 0.00,
    "longitude": 0.00,
    "normal": "",
    "over_weight": "",
    "road_code": "",
    "road_id": 0,
    "stop": "0",
    "unique_vehicles": 0
  })

  return (
    <GPSContext.Provider
      value={{
        route,
        setRoute,
        licenseOpen,
        setLicenseOpen,
        selectRoute,
        setSelectRoute
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
