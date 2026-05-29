"use client"
import { BureauItem, BureauRoute, BureauSign, BureauState } from '@/components/list';
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
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
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const ControlVMSContext = createContext<ContextProps | null>(null)

export const ControlVMSProvider = (props: PageProviderProps) => {
  const { children } = props
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const [bureau, setBureau] = useState<BureauItem | null>({
    id: '',
    title: '',
    total_active: 0,
    total_inactive: 0,
    latitude: 0,
    longitude: 0,
    state: []
  })
  const [bureauState, setBureauState] = useState<BureauState | null>({
    id: '',
    title: '',
    total_active: 0,
    total_inactive: 0,
    latitude: 0,
    longitude: 0,
    route: []
  })
  const [bureauRoute, setBureauRoute] = useState<BureauRoute | null>({
    id: '',
    title: '',
    total_active: 0,
    total_inactive: 0,
    latitude: 0,
    longitude: 0,
    sign: []
  })
  const [bureauSign, setBureauSign] = useState<BureauSign | null>({
    id: '',
    name: '',
    anydesk: '',
    is_active: false,
    latitude: 0,
    longitude: 0,
    vms_img: ''
  })
  const [isAddMode, setAddMode] = useState<boolean>(false)

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
        setAddMode
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
