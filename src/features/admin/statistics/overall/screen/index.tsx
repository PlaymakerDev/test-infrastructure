"use client"
import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  TitleSection,
  OverviewSection,
  IncidentSection,
  AlertSection,
  StatusSection,
} from '../components'
import { StatisticsMinimumFontSize } from '../components/shared'

const StatisticsScreen: React.FC = () => {
  const searchParams = useSearchParams()
  const hasStatus = searchParams.has('status')
  const hasIncident = searchParams.has('incident')
  const hasAlert = searchParams.has('alert')

  const currentTab = useMemo(() => {
    if (hasStatus) return 'STATUS'
    if (hasIncident) return 'INCIDENT'
    if (hasAlert) return 'ALERT'
    return 'OVERVIEW'
  }, [hasStatus, hasIncident, hasAlert])

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERVIEW':
        return <OverviewSection />
      case 'INCIDENT':
        return <IncidentSection />
      case 'ALERT':
        return <AlertSection />
      case 'STATUS':
        return <StatusSection />
      default:
        return <OverviewSection />
    }
  }, [currentTab])

  return (
    <div className={`main-screen statistics-font-min-14 ${(currentTab === 'STATUS' || currentTab === 'ALERT' || currentTab === 'INCIDENT') ? 'px-0' : 'px-3 sm:px-10'}`}>
      <StatisticsMinimumFontSize />
      <TitleSection />
      <section className={(currentTab === 'STATUS' || currentTab === 'ALERT' || currentTab === 'INCIDENT') ? 'mt-2' : 'mt-8'}>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo(StatisticsScreen)
