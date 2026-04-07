"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const DashboardContext = createContext<ContextProps | null>(null)

export const DashboardProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <DashboardContext.Provider
      value={{}}
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
