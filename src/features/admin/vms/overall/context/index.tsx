"use client"
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  mediaExpanded: boolean;
  setMediaExpanded: (v: boolean) => void;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const VmsContext = createContext<ContextProps | null>(null)

export const VmsProvider = (props: PageProviderProps) => {
  const { children } = props
  const [mediaExpanded, setMediaExpanded] = useState(false)

  return (
    <VmsContext.Provider value={{ mediaExpanded, setMediaExpanded }}>
      {children}
    </VmsContext.Provider>
  )
}

export const useVmsContext = () => {
  const context = useContext(VmsContext);
  if (!context) {
    throw new Error("useVmsContext must be used within a VmsProvider");
  }
  return context;
};
