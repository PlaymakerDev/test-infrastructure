"use client"
import { createContext, useContext, useState } from 'react'

export interface StatisticsContextProps {
  currentTab: string;
  setCurrentTab: (value: string) => void;
  activePeriod: string;
  setActivePeriod: (value: string) => void;
}

export interface StatisticsProviderProps {
  children: React.ReactNode
}

export const StatisticsContext = createContext<StatisticsContextProps | null>(null)

export const StatisticsProvider = (props: StatisticsProviderProps) => {
  const { children } = props
  const [currentTab, setCurrentTab] = useState('OVERVIEW')
  const [activePeriod, setActivePeriod] = useState('ALL')

  return (
    <StatisticsContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        activePeriod,
        setActivePeriod,
      }}
    >
      {children}
    </StatisticsContext.Provider>
  )
}

export const useStatisticsContext = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error("useStatisticsContext must be used within a StatisticsProvider");
  }
  return context;
};
