"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {

}

export interface PageProviderProps {
  children: React.ReactNode
}

export const CCTVContext = createContext<ContextProps | null>(null)

export const CCTVProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <CCTVContext.Provider
      value={{
      }}
    >
      {children}
    </CCTVContext.Provider>
  )
}

export const useCCTVContext = () => {
  const context = useContext(CCTVContext);
  if (!context) {
    throw new Error("useCCTVContext must be used within a CCTVProvider");
  }
  return context;
};
