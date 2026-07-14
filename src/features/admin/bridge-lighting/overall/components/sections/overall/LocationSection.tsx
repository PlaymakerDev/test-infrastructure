"use client"
import React from 'react'
import { MapBridgeLighting, StatusBridgeLighting } from '../../../components'
import InfoCardSection from './InfoCardSection'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props { }

const LocationSection: React.FC<Props> = () => {
  return (
    <MapFocusGrid
      desktopCols='360px minmax(0, 1fr) 280px'
      focusedCols='0px minmax(0, 1fr) 0px'
    >
      {/* Left rail — latest bridge status (Figma-perfect sparkle card) */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <StatusBridgeLighting />
      </MapOverlayPanel>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapBridgeLighting edgeFade={{ all: 10 }} />
      </div>

      {/* Right rail — 3 stat cards */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <InfoCardSection />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationSection)
