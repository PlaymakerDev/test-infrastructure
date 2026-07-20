"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  /** Work-status card data (StatusBridgeLighting) — placeholder values until
   *  the bridge detail API is wired; the component isn't mounted anywhere yet
   *  but reads these fields, so the type must carry them. */
  bridge: { statusText: string; lastUpdate: string }
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider: React.FC<PageProviderProps> = (props) => {
  const { children } = props

  return (
    <DetailContext.Provider value={{
      bridge: { statusText: '-', lastUpdate: '-' },
    }}>
      {children}
    </DetailContext.Provider>
  )
}

export const useDetailContext = () => {
  const context = useContext(DetailContext)
  if (!context) throw new Error('useDetailContext must be used within a DetailProvider')
  return context
}
