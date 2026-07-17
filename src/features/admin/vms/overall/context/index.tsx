"use client"
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  openVMSScreen: ModalVMSScreenProps
  setOpenVMSScreen: React.Dispatch<React.SetStateAction<ModalVMSScreenProps>>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export interface ModalVMSScreenProps {
  open: boolean
  data?: VMSScreenProps
}

export interface VMSScreenProps {
  solution_id?: number
  desktop_screen?: string
}

export const INIT_VMS_SCREEN: ModalVMSScreenProps = {
  open: false,
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props
  const [openVMSScreen, setOpenVMSScreen] = useState<ModalVMSScreenProps>(INIT_VMS_SCREEN)

  return (
    <OverallContext.Provider
      value={{
        openVMSScreen,
        setOpenVMSScreen
      }}
    >
      {children}
    </OverallContext.Provider>
  )
}

export const useOverallContext = () => {
  const context = useContext(OverallContext)
  if (!context) throw new Error('useOverallContext must be used within a OverallProvider')
  return context
}
