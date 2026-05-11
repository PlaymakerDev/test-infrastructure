"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const GPSContext = createContext<ContextProps | null>(null)

export const GPSProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <GPSContext.Provider
      value={{}}
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
