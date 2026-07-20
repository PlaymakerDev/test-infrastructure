"use client"
import { createContext, useContext, useState } from 'react'
import dayjs from 'dayjs'
import type { MobileMasterData } from '@/types/tracking/detail-api'
import type { MobileVehicleSearchParams } from '../components/sections/vehicle/FormSearchVehicle'

export interface OpenMobileLogProps {
  open: boolean
  record: MobileMasterData | null
}

export const INIT_OPEN_MOBILE_LOG: OpenMobileLogProps = {
  open: false,
  record: null,
}

export interface ContextProps {
  id: string[] | string | number | undefined
  currentTab: string
  setCurrentTab: (tab: string) => void
  searchParams: MobileVehicleSearchParams
  setSearchParams: React.Dispatch<React.SetStateAction<MobileVehicleSearchParams>>
  openMobileLog: OpenMobileLogProps
  setOpenMobileLog: React.Dispatch<React.SetStateAction<OpenMobileLogProps>>
}

export interface PageProviderProps {
  id: string[] | string | number | undefined
  children: React.ReactNode
}

export const MobileContext = createContext<ContextProps | null>(null)

export const MobileProvider = (props: PageProviderProps) => {
  const { id, children } = props
  const [currentTab, setCurrentTab] = useState<string>('OVERALL')
  const [searchParams, setSearchParams] = useState<MobileVehicleSearchParams>({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  })
  const [openMobileLog, setOpenMobileLog] = useState<OpenMobileLogProps>(INIT_OPEN_MOBILE_LOG)

  return (
    <MobileContext.Provider
      value={{
        id,
        currentTab,
        setCurrentTab,
        searchParams,
        setSearchParams,
        openMobileLog,
        setOpenMobileLog,
      }}
    >
      {children}
    </MobileContext.Provider>
  )
}

export const useMobileContext = () => {
  const context = useContext(MobileContext)
  if (!context) throw new Error('useMobileContext must be used within a MobileProvider')
  return context
}
