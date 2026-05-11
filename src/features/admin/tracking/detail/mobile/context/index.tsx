"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const MobileContext = createContext<ContextProps | null>(null)

export const MobileProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <MobileContext.Provider
      value={{}}
    >
      {children}
    </MobileContext.Provider>
  )
}

export const useMobileContext = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error("useMobileContext must be used within a MobileProvider");
  }
  return context;
};
