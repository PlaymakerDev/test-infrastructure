"use client"
import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MaintenanceTitleSection,
  MaintenanceOverviewSection,
} from '../components'
import { RepairRecordsSection } from '../../repair-history/components'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'

const MaintenanceContent: React.FC = () => {
  const searchParams = useSearchParams()
  const hasRepair = searchParams.has('repair')

  const period = searchParams.get('period') || 'TODAY'

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
    <div className="main-screen maintenance-font-min-14">
      <MaintenanceMinimumFontSize />
      <div className="px-3 sm:px-10">
        <MaintenanceTitleSection />
      </div>
      <section className={hasRepair ? '' : 'mt-8 px-3 sm:px-10'}>
        {renderContent}
      </section>
    </div>
  )
}

const MaintenanceScreen: React.FC = () => {
  return <MaintenanceContent />
}

export default React.memo(MaintenanceScreen)
