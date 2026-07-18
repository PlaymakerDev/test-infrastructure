"use client"
import React from 'react'
import KPISection from './sections/overall/KPISection'
import MapSection from './sections/overall/MapSection'
import RecentPlatesSection from './sections/overall/RecentPlatesSection'
import CameraListSection from './sections/overall/CameraListSection'
import HourlyChartSection from './sections/overall/HourlyChartSection'
import BreakdownSection from './sections/overall/BreakdownSection'

interface Props {
  onShowAllDetections?: () => void
}

/** Detail Tab 1 — ภาพรวม. Layout mirrors dmon's professional AnprOverviewTab:
 *   Row 1  4 KPI cards (today, hour, cameras, avg speed w/ ▲▼ vs yesterday)
 *   Row 2  Hourly chart (2/3) + Recent detections list (1/3)
 *   Row 3  Province Top-10 bar + Vehicle-type donut (side-by-side)
 *   Row 4  Map (2/3) + Camera list (1/3) */
const OverallSection: React.FC<Props> = ({ onShowAllDetections }) => {
  return (
    <div className='flex flex-col gap-6'>
      <KPISection />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2'>
          <HourlyChartSection />
        </div>
        <div className='lg:col-span-1'>
          <RecentPlatesSection onShowAll={onShowAllDetections} />
        </div>
      </div>

      <BreakdownSection />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2 rounded-2xl overflow-hidden bg-(--mid-gray) h-96'>
          <MapSection />
        </div>
        <div className='lg:col-span-1'>
          <CameraListSection />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
