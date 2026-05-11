"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const WIMContext = createContext<ContextProps | null>(null)

export const WIMProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <WIMContext.Provider
      value={{}}
    >
      {children}
    </WIMContext.Provider>
  )
}

export const useWIMContext = () => {
  const context = useContext(WIMContext);
  if (!context) {
    throw new Error("useWIMContext must be used within a WIMProvider");
  }
  return context;
};
