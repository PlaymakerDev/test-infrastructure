"use client"
import type { BureauItem, BureauRoute, BureauSign, BureauState } from '@/types/control-vms/bureau'
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  bureau: BureauItem | null
  setBureau: (b: BureauItem | null) => void
  bureauState: BureauState | null
  setBureauState: (s: BureauState | null) => void
  bureauRoute: BureauRoute | null
  setBureauRoute: (r: BureauRoute | null) => void
  bureauSign: BureauSign | null
  setBureauSign: (s: BureauSign | null) => void
  isAddMode: boolean
  setAddMode: (v: boolean) => void
  vmsIdList: number[]
  setVMSIdList: React.Dispatch<React.SetStateAction<number[]>>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const ControlVMSContext = createContext<ContextProps | null>(null)

export const ControlVMSProvider = (props: PageProviderProps) => {
  const { children } = props
  const [bureau, setBureau] = useState<BureauItem | null>(null)
  const [bureauState, setBureauState] = useState<BureauState | null>(null)
  const [bureauRoute, setBureauRoute] = useState<BureauRoute | null>(null)
  const [bureauSign, setBureauSign] = useState<BureauSign | null>(null)
  const [isAddMode, setAddMode] = useState<boolean>(false)
  const [vmsIdList, setVMSIdList] = useState<number[]>([])

  return (
    <ControlVMSContext.Provider
      value={{
        bureau,
        setBureau,
        bureauState,
        setBureauState,
        bureauRoute,
        setBureauRoute,
        bureauSign,
        setBureauSign,
        isAddMode,
        setAddMode,
        vmsIdList,
        setVMSIdList,
      }}
    >
      {children}
    </ControlVMSContext.Provider>
  )
}

export const useControlVMSContext = () => {
  const context = useContext(ControlVMSContext)
  if (!context) {
    throw new Error('useControlVMSContext must be used within a ControlVMSProvider')
  }
  return context
}
