"use client"
import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MaintenanceTitleSection,
  MaintenanceOverviewSection,
  RepairRecordsSection,
} from '../components'
import { MaintenanceProvider } from '../context'

const MaintenanceContent: React.FC = () => {
  const searchParams = useSearchParams()
  const hasRepair = searchParams.has('repair')

  const currentTab = useMemo(() => {
    if (hasRepair) return 'REPAIR'
    return 'OVERVIEW'
  }, [hasRepair])

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERVIEW':
        return <MaintenanceOverviewSection />
      case 'REPAIR':
        return <RepairRecordsSection />
      default:
        return <MaintenanceOverviewSection />
    }
  }, [currentTab])

  return (
    <div className="main-screen">
      <div className={hasRepair ? 'px-0' : 'px-3 sm:px-10'}>
        <MaintenanceTitleSection />
      </div>
      <section className={hasRepair ? '' : 'mt-8 px-3 sm:px-10'}>
        {renderContent}
      </section>
    </div>
  )
}

const MaintenanceScreen: React.FC = () => {
  return (
    <MaintenanceProvider>
      <MaintenanceContent />
    </MaintenanceProvider>
  )
}

export default React.memo(MaintenanceScreen)
