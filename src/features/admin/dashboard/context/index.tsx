"use client"
import { DashboardBucketType } from '@/types/dashboard/api';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
}

export interface PageProviderProps {
  children: React.ReactNode
}

// Visible tab labels → backend `type=` value. The fourth bucket (weekly) is
// available on the API but the design only exposes three tabs.
export const TAB_TO_TYPE: Record<string, DashboardBucketType> = {
  วันนี้: 'daily',
  เดือน: 'monthly',
  ปี: 'yearly',
}
export const TAB_OPTIONS = Object.keys(TAB_TO_TYPE)

export const DashboardContext = createContext<ContextProps | null>(null)

export const DashboardProvider = (props: PageProviderProps) => {
  const { children } = props
  const [tab, setTab] = useState('วันนี้')

  return (
    <DashboardContext.Provider
      value={{ tab, setTab }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
};
