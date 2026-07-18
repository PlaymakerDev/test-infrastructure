"use client"
import { createContext, useContext, useState } from 'react'
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
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props
  const [selected, setSelected] = useState<SelectedPlate | null>(null)
  return (
    <OverallContext.Provider
      value={{
        selected,
        setSelected,
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
