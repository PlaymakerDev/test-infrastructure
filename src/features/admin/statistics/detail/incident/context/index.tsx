"use client"
import React, { createContext, useContext, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

interface IncidentDetailContextType {
  searchText: string
  setSearchText: (v: string) => void
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
  const today = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([today.subtract(2, 'day').startOf('day'), today.endOf('day')])

  return (
    <IncidentDetailContext.Provider value={{ searchText, setSearchText, dateRange, setDateRange }}>
      {children}
    </IncidentDetailContext.Provider>
  )
}
