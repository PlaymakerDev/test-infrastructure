"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {}

export interface PageProviderProps {
  children: React.ReactNode
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = (props: PageProviderProps) => {
  const { children } = props
  return (
    <DetailContext.Provider value={{}}>
      {children}
    </DetailContext.Provider>
  )
}

export const useDetailContext = () => {
  const context = useContext(DetailContext)
  if (!context) throw new Error('useDetailContext must be used within a DetailProvider')
  return context
}
