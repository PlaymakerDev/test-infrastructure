"use client"
import { createContext, useContext, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

export interface StatusDetailContextProps {
  searchText: string;
  setSearchText: (value: string) => void;
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  setDateRange: (value: [Dayjs | null, Dayjs | null] | null) => void;
}

export interface StatusDetailProviderProps {
  children: React.ReactNode
}

export const StatusDetailContext = createContext<StatusDetailContextProps | null>(null)

export const StatusDetailProvider = (props: StatusDetailProviderProps) => {
  const { children } = props
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(true)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs(), dayjs()])

  return (
    <StatusDetailContext.Provider
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
    </StatusDetailContext.Provider>
  )
}

export const useStatusDetailContext = () => {
  const context = useContext(StatusDetailContext);
  if (!context) {
    throw new Error("useStatusDetailContext must be used within a StatusDetailProvider");
  }
  return context;
};
