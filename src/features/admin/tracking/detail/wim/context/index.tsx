"use client"
import { createContext, useContext, useState } from 'react'
import dayjs from 'dayjs'
import type { APIRequestStationDaily } from '@/types/tracking/detail-api'
import { toStationTypeId } from '@/constants/tracking'

export interface ContextProps {
  id: string[] | string | number | undefined
  stationType: string | null | undefined
  stationTypeId: number | null
  currentTab: string
  setCurrentTab: (tab: string) => void
  vehicleSearchParams: APIRequestStationDaily
  setVehicleSearchParams: React.Dispatch<React.SetStateAction<APIRequestStationDaily>>
  openWeightLogModal: ModalWeightLogProps
  setOpenWeightLogModal: React.Dispatch<React.SetStateAction<ModalWeightLogProps>>
}

export interface PageProviderProps {
  id: string[] | string | number | undefined
  stationType: string | null | undefined
  children: React.ReactNode
}

export interface ModalWeightLogProps {
  open: boolean
  stationId?: string[] | string | number | undefined
  stationType?: string | null | undefined
  stationName?: string
  date?: string
}

export const INIT_MODAL_WEIGHT_LOG: ModalWeightLogProps = {
  open: false,
}

export const WIMContext = createContext<ContextProps | null>(null)

export const WIMProvider = (props: PageProviderProps) => {
  const { id, stationType, children } = props
  const [currentTab, setCurrentTab] = useState<string>('OVERALL')
  const [vehicleSearchParams, setVehicleSearchParams] = useState<APIRequestStationDaily>({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  })
  const [openWeightLogModal, setOpenWeightLogModal] = useState<ModalWeightLogProps>(INIT_MODAL_WEIGHT_LOG)

  return (
    <WIMContext.Provider
      value={{
        id,
        stationType,
        stationTypeId: toStationTypeId(stationType),
        currentTab,
        setCurrentTab,
        vehicleSearchParams,
        setVehicleSearchParams,
        openWeightLogModal,
        setOpenWeightLogModal,
      }}
    >
      {children}
    </WIMContext.Provider>
  )
}

export const useWIMContext = () => {
  const context = useContext(WIMContext)
  if (!context) throw new Error('useWIMContext must be used within a WIMProvider')
  return context
}
