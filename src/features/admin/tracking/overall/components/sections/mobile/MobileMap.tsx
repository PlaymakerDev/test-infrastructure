"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import TrackingOverviewMarker from '@/components/map/markers/TrackingOverviewMarker'
import { TRACKING_STATIONS } from '@/features/admin/tracking/overall/data/trackingStations'

// Mobile tab: show only mobile-type stations (magenta pins) — same look & popup
// as the overview tab, just filtered.
const VISIBLE_TYPES = new Set(['mobile'] as const)

interface Props {}

const MobileMap: React.FC<Props> = () => {
  return (
    <div className="h-full">
      <BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
        <ThailandMaskLayer />
        <TrackingOverviewMarker
          stations={TRACKING_STATIONS}
          visibleTypes={VISIBLE_TYPES}
        />
      </BaseMap>
    </div>
  )
}

export default React.memo<Props>(MobileMap)
