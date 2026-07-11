"use client"
import type { BureauItem, BureauRoute, BureauSign, BureauState } from '@/types/control-vms/bureau'
import { APIRequestVMSSettingByRoad, APIRequestVMSSettingSchedule, VMSScheduleByDate } from '@/types/control-vms/display-api'
import { APIRequestPostVMSMedia } from '@/types/control-vms/vms-api'
import dayjs from 'dayjs'
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
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
  searchText: APIRequestVMSSettingByRoad | null
  setSearchText: (s: APIRequestVMSSettingByRoad | null) => void
  searchDate: APIRequestVMSSettingSchedule | null
  setSearchDate: (s: APIRequestVMSSettingSchedule | null) => void
  scheduleDay: string | null
  setScheduleDay: (d: string | null) => void
  updateScheduleState: UpdateScheduleState
  setUpdateScheduleState: React.Dispatch<React.SetStateAction<UpdateScheduleState>>
  openVMSScreen: OpenVMSScreenState
  setOpenVMSScreen: React.Dispatch<React.SetStateAction<OpenVMSScreenState>>
  statusSearchText: string
  setStatusSearchText: (s: string) => void
  openConfirmCreate: OpenConfirmCreateState
  setOpenConfirmCreate: React.Dispatch<React.SetStateAction<OpenConfirmCreateState>>
  openUpdateType: OpenUpdateTypeState
  setOpenUpdateType: React.Dispatch<React.SetStateAction<OpenUpdateTypeState>>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export interface UpdateScheduleState {
  open: boolean
  id?: string | number | null
  type: 'CREATE' | 'EDIT' | 'DELETE' | 'BATCH_DELETE'
  vmsOption?: VMSScheduleByDate
}

export const INIT_UPDATE_SCHEDULE: UpdateScheduleState = {
  open: false,
  id: null,
  type: 'CREATE'
}

export interface OpenVMSScreenState {
  open: boolean
  id: number | null
  vms_url: string
}

export interface OpenConfirmCreateState {
  open: boolean
  ids: number[]
  body: APIRequestPostVMSMedia | null
  /** Present when confirming an EDIT (routes to PUT); null/absent for CREATE (POST). */
  id?: string | number | null
}

export interface OpenUpdateTypeState {
  open: boolean
}

export const INIT_OPEN_VMS_SCREEN: OpenVMSScreenState = {
  open: false,
  id: null,
  vms_url: ''
}

export const INIT_OPEN_CONFIRM_CREATE: OpenConfirmCreateState = { open: false, ids: [], body: null, id: null }

export const INIT_OPEN_UPDATE_TYPE: OpenUpdateTypeState = { open: false }

export const ControlVMSContext = createContext<ContextProps | null>(null)

export const ControlVMSProvider = (props: PageProviderProps) => {
  const { children } = props
  const [currentTab, setCurrentTab] = useState<string>('VMS')
  const [bureau, setBureau] = useState<BureauItem | null>(null)
  const [bureauState, setBureauState] = useState<BureauState | null>(null)
  const [bureauRoute, setBureauRoute] = useState<BureauRoute | null>(null)
  const [bureauSign, setBureauSign] = useState<BureauSign | null>(null)
  const [isAddMode, setAddMode] = useState<boolean>(false)
  const [vmsIdList, setVMSIdList] = useState<number[]>([])
  const [searchText, setSearchText] = useState<APIRequestVMSSettingByRoad | null>(null)
  const [searchDate, setSearchDate] = useState<APIRequestVMSSettingSchedule | null>({
    month: dayjs().month() + 1,
    year: dayjs().year()
  })
  const [scheduleDay, setScheduleDay] = useState<string | null>(dayjs().format('DD'))
  const [updateScheduleState, setUpdateScheduleState] = useState<UpdateScheduleState>(INIT_UPDATE_SCHEDULE)
  const [openVMSScreen, setOpenVMSScreen] = useState<OpenVMSScreenState>(INIT_OPEN_VMS_SCREEN)
  const [statusSearchText, setStatusSearchText] = useState<string>('')
  const [openConfirmCreate, setOpenConfirmCreate] = useState<OpenConfirmCreateState>(INIT_OPEN_CONFIRM_CREATE)
  const [openUpdateType, setOpenUpdateType] = useState<OpenUpdateTypeState>(INIT_OPEN_UPDATE_TYPE)

  return (
    <ControlVMSContext.Provider
      value={{
        currentTab,
        setCurrentTab,
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
        searchText,
        setSearchText,
        searchDate,
        setSearchDate,
        scheduleDay,
        setScheduleDay,
        updateScheduleState,
        setUpdateScheduleState,
        openVMSScreen,
        setOpenVMSScreen,
        statusSearchText,
        setStatusSearchText,
        openConfirmCreate,
        setOpenConfirmCreate,
        openUpdateType,
        setOpenUpdateType,
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
