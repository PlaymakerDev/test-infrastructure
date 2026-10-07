"use client"
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetLPRLicenseSearch } from '@/stores/reducers/lpr/lprSlice'
import type { LPRSource } from '@/types/lpr/lpr-api'

// (plate_number, plate_province) is the composite identity of a plate — the
// detail/timeline endpoints are keyed on both. Detail data is NOT stored here;
// child components fetch it via hooks keyed on this selection.
export interface SelectedPlate {
  plate_number: string
  plate_province: string
  // All sources this plate has been seen with (v2 list `sources`). Drives the
  // WIM-only vs ANPR display (single card + "ประเภท N" badge for WIM-only;
  // ANPR metadata + type-name badge whenever anpr is present). Optional.
  sources?: LPRSource[]
}

export interface ContextProps {
  selected: SelectedPlate | null
  setSelected: React.Dispatch<React.SetStateAction<SelectedPlate | null>>
  /** Text the plate-search box starts with — '' unless the page was opened from
   *  the detail page's "ดูประวัติการเดินทาง". Set at mount so every
   *  SearchSection (side panel + drawer) seeds from the same value, and
   *  cleared once the user switches tab (`clearInitialSearch`) so it applies
   *  only to that first visit of the license tab. */
  initialSearch: string
  clearInitialSearch: () => void
  /** True while the plate list's first page is loading. The list lives in
   *  SearchSection (its own `q`) but is what produces `selected`, so the
   *  selection-driven panels read this to show a skeleton instead of
   *  "ไม่พบข้อมูลป้ายทะเบียน" before any plate could have been selected. Starts
   *  true so nothing flashes "not found" on the first paint. */
  searchLoading: boolean
  setSearchLoading: (loading: boolean) => void
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props
  const dispatch = useAppDispatch()
  const [selected, setSelected] = useState<SelectedPlate | null>(null)

  // One-shot hand-off from the detail page (lprSlice): capture it into state
  // for this mount, then reset the store so a later visit — back/forward, the
  // sidebar — starts with an empty search.
  const handedOffSearch = useAppSelector((state) => state.lpr.license_search.q)
  const [initialSearch, setInitialSearch] = useState(handedOffSearch)
  useEffect(() => {
    if (handedOffSearch) dispatch(resetLPRLicenseSearch())
  }, [handedOffSearch, dispatch])
  // The license tab unmounts when the user switches away, so without this every
  // return to it would remount SearchSection and re-apply the same plate.
  const clearInitialSearch = useCallback(() => setInitialSearch(''), [])

  const [searchLoading, setSearchLoading] = useState(true)

  return (
    <OverallContext.Provider
      value={{
        selected,
        setSelected,
        initialSearch,
        clearInitialSearch,
        searchLoading,
        setSearchLoading,
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
