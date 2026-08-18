"use client"
import { APIRequestTrackingMobileMaster, APIRequestTrackingPosition, APIRequestTrackingViewSumPlanChart, CCTVList } from '@/types/tracking/overall-api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { TRACKING_CONTENT_TABS, allowedTrackingContentTabs } from '../data/tabs'

// 'TRACK_GPS' has no entry here on purpose — TitleSection navigates straight to
// /admin/tracking/detail/gps for it instead of calling setCurrentTab, so it never
// reaches this list as a value to validate/persist.
const VALID_TABS = TRACKING_CONTENT_TABS

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
  const [requestedTab, setCurrentTabState] = useState<string>(
    (VALID_TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as string) : 'OVERALL'
  )

  const { role } = useUserRole()
  const allowedTabs = useMemo(() => allowedTrackingContentTabs(role), [role])

  // Clamp DERIVED rather than in an effect: `?tab=OVERALL` on a contractor's
  // session (typed URL, shared link, or a stale back-navigation) must never
  // render the overview for even one commit — that would fire its queries.
  // The effect below only brings the URL back in line afterwards.
  const currentTab = (allowedTabs as readonly string[]).includes(requestedTab)
    ? requestedTab
    : allowedTabs[0]

  const writeTabParam = useCallback((value: string) => {
    if (!(VALID_TABS as readonly string[]).includes(value)) return
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('tab') === value) return
    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const setCurrentTab = useCallback((value: string) => {
    setCurrentTabState(value)
    writeTabParam(value)
  }, [writeTabParam])

  // Bring `?tab=` back in line when the clamp overrode what the URL asked for.
  // Only the URL — an external system — is touched: `requestedTab` deliberately
  // keeps the rejected value, because `currentTab` is derived from it and the
  // clamp is idempotent, so there's nothing to reconcile in React state.
  useEffect(() => {
    if (currentTab !== requestedTab) writeTabParam(currentTab)
  }, [currentTab, requestedTab, writeTabParam])

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
