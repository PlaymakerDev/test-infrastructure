"use client"
import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MaintenanceTitleSection,
  MaintenanceOverviewSection,
} from '../components'
import { RepairRecordsSection } from '../../repair-history/components'
import { MaintenanceProvider } from '../context'

const MaintenanceContent: React.FC = () => {
  const searchParams = useSearchParams()
  const hasRepair = searchParams.has('repair')

  const period = searchParams.get('period') || undefined

  const currentTab = useMemo(() => {
    if (hasRepair) return 'REPAIR'
    return 'OVERVIEW'
  }, [hasRepair])

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERVIEW':
        return <MaintenanceOverviewSection period={period} />
      case 'REPAIR':
        return <RepairRecordsSection />
      default:
        return <MaintenanceOverviewSection period={period} />
    }
  }, [currentTab, period])

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
