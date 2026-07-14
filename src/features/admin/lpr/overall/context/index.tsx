"use client"
import { createContext, useContext, useState } from 'react'
import { LicenseItem } from '../components/sections/license/LicenseList';

export interface ContextProps {
  license: LicenseItem;
  setLicense: React.Dispatch<React.SetStateAction<LicenseItem>>;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
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
    <OverallContext.Provider
      value={{
        license,
        setLicense
      }}
    >
      {children}
    </OverallContext.Provider>
  )
}

export const useOverallContext = () => {
  const context = useContext(OverallContext)
  if (!context) throw new Error('useOverallContext must be used within a OverallProvider')
  return context
}
