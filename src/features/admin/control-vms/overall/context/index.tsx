"use client"
import { BureauItem, BureauRoute, BureauSign, BureauState } from '@/components/list';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  // BUREAU
  mediaExpanded: boolean;
  setMediaExpanded: (v: boolean) => void;
  bureau: BureauItem | null;
  setBureau: (b: BureauItem | null) => void;
  bureauState: BureauState | null;
  setBureauState: (s: BureauState | null) => void;
  bureauRoute: BureauRoute | null;
  setBureauRoute: (r: BureauRoute | null) => void;
  bureauSign: BureauSign | null;
  setBureauSign: (s: BureauSign | null) => void;
  isAddMode: boolean;
  setAddMode: (v: boolean) => void;
  // VMS SCREEN
  openVMSScreen: ModalVMSScreenProps
  setOpenVMSScreen: React.Dispatch<React.SetStateAction<ModalVMSScreenProps>>
  // VMS ID LIST
  vmsIdList: number[]
  setVMSIdList: React.Dispatch<React.SetStateAction<number[]>>
  // VMS MEDIA
  openMediaModal: ModalMediaProps
  setOpenMediaModal: React.Dispatch<React.SetStateAction<ModalMediaProps>>
}

export interface ModalVMSScreenProps {
  open: boolean
  data?: BureauSign | null
}

export interface ModalMediaProps {
  open: boolean
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const ControlVMSContext = createContext<ContextProps | null>(null)

export const INIT_VMS_SCREEN: ModalVMSScreenProps = {
  open: false,
  data: {
    vms_id: 0,
    solution_id: 0,
    solution_name: '',
    desktop_screen: '',
    last_connected: '',
    camera_online_count: 0,
    camera_offline_count: 0,
    anydesk: '',
    geo_point: [],
    is_online: false,
    project: {
      budget_year: 0,
      contract_no: '',
      id: 0,
      name: '',
      project_name: ''
    }
  }
}

export const INIT_MEDIA_MODAL: ModalMediaProps = {
  open: false
}

export const ControlVMSProvider = (props: PageProviderProps) => {
  const { children } = props
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const [bureau, setBureau] = useState<BureauItem | null>({
    department_id: 0,
    department_short_name: '',
    camera_online_count: 0,
    camera_offline_count: 0,
    sub_department: []
  })
  const [bureauState, setBureauState] = useState<BureauState | null>({
    department_id: 0,
    department_short_name: '',
    camera_online_count: 0,
    camera_offline_count: 0,
    roads: []
  })
  const [bureauRoute, setBureauRoute] = useState<BureauRoute | null>({
    road_id: 0,
    road_name: '',
    road_code: '',
    solution: []
  })
  const [bureauSign, setBureauSign] = useState<BureauSign | null>({
    vms_id: 0,
    solution_id: 0,
    solution_name: '',
    desktop_screen: '',
    last_connected: '',
    camera_online_count: 0,
    camera_offline_count: 0,
    anydesk: '',
    geo_point: [],
    is_online: false,
    project: {
      budget_year: 0,
      contract_no: '',
      id: 0,
      name: '',
      project_name: ''
    }
  })
  const [isAddMode, setAddMode] = useState<boolean>(false)
  const [openVMSScreen, setOpenVMSScreen] = useState<ModalVMSScreenProps>(INIT_VMS_SCREEN)
  const [vmsIdList, setVMSIdList] = useState<number[]>([])
  const [openMediaModal, setOpenMediaModal] = useState<ModalMediaProps>(INIT_MEDIA_MODAL)

  return (
    <ControlVMSContext.Provider
      value={{
        mediaExpanded,
        setMediaExpanded,
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
        openVMSScreen,
        setOpenVMSScreen,
        vmsIdList,
        setVMSIdList,
        openMediaModal,
        setOpenMediaModal
      }}
    >
      {children}
    </ControlVMSContext.Provider>
  )
}

export const useControlVMSContext = () => {
  const context = useContext(ControlVMSContext);
  if (!context) {
    throw new Error("useControlVMSContext must be used within a ControlVMSProvider");
  }
  return context;
};
