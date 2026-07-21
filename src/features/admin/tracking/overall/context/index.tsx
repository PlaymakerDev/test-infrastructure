"use client"
import { APIRequestTrackingMobileMaster, APIRequestTrackingPosition, APIRequestTrackingViewSumPlanChart, CCTVList } from '@/types/tracking/overall-api';
import { createContext, useCallback, useContext, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// 'TRACK_GPS' has no entry here on purpose — TitleSection navigates straight to
// /admin/tracking/detail/gps for it instead of calling setCurrentTab, so it never
// reaches this list as a value to validate/persist.
const VALID_TABS = ['OVERALL', 'STATION', 'WIM', 'MOBILE'] as const

export interface ModalCCTVDataProps {
  open: boolean
  item: CCTVList | null
}

export const INIT_MODAL_CCTV_DATA: ModalCCTVDataProps = {
  open: false,
  item: null,
}

export interface ContextProps {
  currentTab: string
  setCurrentTab: (value: string) => void
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [currentTab, setCurrentTabState] = useState<string>(
    (VALID_TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as string) : 'OVERALL'
  )

  const setCurrentTab = useCallback((value: string) => {
    setCurrentTabState(value)
    if ((VALID_TABS as readonly string[]).includes(value)) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [router, pathname, searchParams])

  const [searchPosition, setSearchPosition] = useState<APIRequestTrackingPosition | null>(null)
  const [searchMobileMaster, setSearchMobileMaster] = useState<APIRequestTrackingMobileMaster | null>(null)
  const [searchSumPlan, setSearchSumPlan] = useState<APIRequestTrackingViewSumPlanChart | null>(null)
  const [openCCTVData, setOpenCCTVData] = useState<ModalCCTVDataProps>(INIT_MODAL_CCTV_DATA)

  return (
    <OverallContext.Provider
      value={{
        currentTab,
        setCurrentTab,
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
