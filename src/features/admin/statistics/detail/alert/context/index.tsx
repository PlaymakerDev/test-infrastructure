"use client"
import { createContext, useContext, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

export interface AlertDetailContextProps {
  searchText: string;
  setSearchText: (value: string) => void;
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  setDateRange: (value: [Dayjs | null, Dayjs | null] | null) => void;
}

export interface AlertDetailProviderProps {
  children: React.ReactNode
}

export const AlertDetailContext = createContext<AlertDetailContextProps | null>(null)

export const AlertDetailProvider = (props: AlertDetailProviderProps) => {
  const { children } = props
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(true)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs(), dayjs()])

  return (
    <AlertDetailContext.Provider
      value={{
        searchText,
        setSearchText,
        searchOpen,
        setSearchOpen,
        dateRange,
        setDateRange,
      }}
    >
      {children}
    </AlertDetailContext.Provider>
  )
}

export const useAlertDetailContext = () => {
  const context = useContext(AlertDetailContext);
  if (!context) {
    throw new Error("useAlertDetailContext must be used within an AlertDetailProvider");
  }
  return context;
};
