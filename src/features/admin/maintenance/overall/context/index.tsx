"use client"
import React, { createContext, useContext } from 'react'

interface MaintenanceContextValue {}

const MaintenanceContext = createContext<MaintenanceContextValue>({})

export const useMaintenanceContext = () => useContext(MaintenanceContext)

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MaintenanceContext.Provider value={{}}>
      {children}
    </MaintenanceContext.Provider>
  )
}
