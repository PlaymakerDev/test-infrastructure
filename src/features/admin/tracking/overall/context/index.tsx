"use client"
import { APIRequestTrackingMobileMaster, APIRequestTrackingPosition, APIRequestTrackingViewSumPlanChart, CCTVList } from '@/types/tracking/overall-api';
import { createContext, useContext, useState } from 'react'

export interface ModalCCTVDataProps {
  open: boolean
  item: CCTVList | null
}

export const INIT_MODAL_CCTV_DATA: ModalCCTVDataProps = {
  open: false,
  item: null,
}

export interface ContextProps {
  searchPosition: APIRequestTrackingPosition | null
  setSearchPosition: (s: APIRequestTrackingPosition | null) => void
  searchMobileMaster: APIRequestTrackingMobileMaster | null
  setSearchMobileMaster: (s: APIRequestTrackingMobileMaster | null) => void
  searchSumPlan: APIRequestTrackingViewSumPlanChart | null
  setSearchSumPlan: (s: APIRequestTrackingViewSumPlanChart | null) => void
  openCCTVData: ModalCCTVDataProps
  setOpenCCTVData: React.Dispatch<React.SetStateAction<ModalCCTVDataProps>>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props
  const [searchPosition, setSearchPosition] = useState<APIRequestTrackingPosition | null>(null)
  const [searchMobileMaster, setSearchMobileMaster] = useState<APIRequestTrackingMobileMaster | null>(null)
  const [searchSumPlan, setSearchSumPlan] = useState<APIRequestTrackingViewSumPlanChart | null>(null)
  const [openCCTVData, setOpenCCTVData] = useState<ModalCCTVDataProps>(INIT_MODAL_CCTV_DATA)

  return (
    <OverallContext.Provider
      value={{
        searchPosition,
        setSearchPosition,
        searchMobileMaster,
        setSearchMobileMaster,
        searchSumPlan,
        setSearchSumPlan,
        openCCTVData,
        setOpenCCTVData,
      }}
    >
      {children}
    </OverallContext.Provider>
  )
}

export const useOverallContext = () => {
  const context = useContext(OverallContext);
  if (!context) {
    throw new Error("useOverallContext must be used within a OverallProvider");
  }
  return context;
};
