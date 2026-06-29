"use client"
import { APIRequestTrackingPosition } from '@/types/tracking/overall-api';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  searchPosition: APIRequestTrackingPosition | null
  setSearchPosition: (s: APIRequestTrackingPosition | null) => void
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props
  const [searchPosition, setSearchPosition] = useState<APIRequestTrackingPosition | null>(null)

  return (
    <OverallContext.Provider
      value={{
        searchPosition,
        setSearchPosition
      }}
    >
      {children}
    </OverallContext.Provider>
  )
}

export const useOverallContext = () => {
  const context = useContext(OverallContext);
  if (!context) {
    throw new Error("useOverallContext must be used within a OverallProvider");
  }
  return context;
};
