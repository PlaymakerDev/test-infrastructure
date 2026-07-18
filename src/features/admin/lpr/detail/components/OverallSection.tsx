"use client"
import React from 'react'
import KPISection from './sections/overall/KPISection'
import MapSection from './sections/overall/MapSection'
import RecentPlatesSection from './sections/overall/RecentPlatesSection'
import CameraListSection from './sections/overall/CameraListSection'

interface Props {
  onShowAllDetections?: () => void
}

/** Detail Tab 1 — ภาพรวม.
 *  Row 1: 4 KPI cards (spans full width).
 *  Row 2: Map (2/3) + Recent detections (1/3) on lg+, stacked on mobile.
 *  Row 3: Camera list (full width) — list of every LPR camera at this
 *         install-point (HLS live-view integration is a follow-up). */
const OverallSection: React.FC<Props> = ({ onShowAllDetections }) => {
  return (
    <div className='flex flex-col gap-6'>
      <KPISection />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2 rounded-2xl overflow-hidden bg-(--mid-gray) h-96'>
          <MapSection />
        </div>
        <div className='lg:col-span-1'>
          <RecentPlatesSection onShowAll={onShowAllDetections} />
        </div>
      </div>

      <CameraListSection />
    </div>
  )
}

export default React.memo<Props>(OverallSection)
