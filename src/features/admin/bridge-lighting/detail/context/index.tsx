"use client"
import { createContext, useContext } from 'react'
import { getBridgeProjectById } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

export interface ContextProps {
  bridge: BridgeProject
}

export interface PageProviderProps {
  id?: string | string[]
  children: React.ReactNode
}

export const DetailContext = createContext<ContextProps | null>(null)

export const DetailProvider = ({ id, children }: PageProviderProps) => {
  const bridge = getBridgeProjectById(id)
  if (!bridge) return null
  return (
    <DetailContext.Provider value={{ bridge }}>
      {children}
    </DetailContext.Provider>
  )
}

export const useDetailContext = () => {
  const context = useContext(DetailContext)
  if (!context) throw new Error('useDetailContext must be used within a DetailProvider')
  return context
}
