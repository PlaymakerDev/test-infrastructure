"use client"
import { LicenseItem, LicenseTimelineItem } from '@/components/list/LicenseList';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  license: LicenseItem;
  setLicense: React.Dispatch<React.SetStateAction<LicenseItem>>;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const LicenseContext = createContext<ContextProps | null>(null)

export const LicenseProvider = (props: PageProviderProps) => {
  const { children } = props
  const [license, setLicense] = useState<LicenseItem>({
    id: "",
    license_no: "",
    license_province: "",
    license_type: "",
    road_description: "",
    sta: "",
    timestamp: ""
  })

  return (
    <LicenseContext.Provider
      value={{
        license,
        setLicense
      }}
    >
      {children}
    </LicenseContext.Provider>
  )
}

export const useLicenseContext = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicenseContext must be used within a LicenseProvider");
  }
  return context;
};
