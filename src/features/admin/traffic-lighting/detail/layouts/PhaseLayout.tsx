"use client"
import React, { useMemo } from 'react'
import { useDetailContext } from '../context'
import {
  MonitorSection,
  OverviewSection,
  SummaryReportSection,
  TitleSection,
} from '../components'

/**
 * Phase detail layout — covers both single-phase (count=1) and three-phase
 * (count=3) cabinets. The real phase (1/3) is fetched per-IMEI via
 * /imei/{imei}/details and used to tweak the electrical card; the overall
 * structure is shared.
 *
 * TEMPORARY: renders the original tabbed UI so the existing components
 * (RemoteControlCard, etc.) stay visible while the real design is built.
 */
const PhaseLayout: React.FC = () => {
  const { currentTab } = useDetailContext()

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERVIEW':
        return <OverviewSection />
      case 'IOT_MONITOR':
        return <MonitorSection />
      case 'SUMMARY':
        return <SummaryReportSection />
      default:
        return null
    }
  }, [currentTab])

  return (
    <>
      <TitleSection />
      {renderContent && <section className='mt-8'>{renderContent}</section>}
    </>
  )
}

export default React.memo(PhaseLayout)
