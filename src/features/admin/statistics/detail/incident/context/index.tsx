"use client"
import React, { createContext, useContext, useState } from 'react'
import type { Dayjs } from 'dayjs'

interface IncidentDetailContextType {
  searchText: string
  setSearchText: (v: string) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  dateRange: [Dayjs | null, Dayjs | null] | null
  setDateRange: (v: [Dayjs | null, Dayjs | null] | null) => void
}

const IncidentDetailContext = createContext<IncidentDetailContextType | null>(null)

export const useIncidentDetailContext = () => {
  const ctx = useContext(IncidentDetailContext)
  if (!ctx) throw new Error('useIncidentDetailContext must be used within IncidentDetailProvider')
  return ctx
}

export const IncidentDetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(true)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  return (
    <IncidentDetailContext.Provider value={{ searchText, setSearchText, searchOpen, setSearchOpen, dateRange, setDateRange }}>
      {children}
    </IncidentDetailContext.Provider>
  )
}
