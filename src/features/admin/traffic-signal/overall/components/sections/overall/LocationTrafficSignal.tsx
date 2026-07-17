"use client"
import React from 'react'
import CctvListTrafficSignal from './CctvListTrafficSignal'
import MapTrafficSignal from './MapTrafficSignal'
import InfoCardTrafficSignal from './InfoCardTrafficSignal'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {}

/** Top-area layout — 3 columns on desktop:
 *  • LEFT: CCTV camera preview list
 *  • CENTER: Thailand map with traffic-signal markers
 *  • RIGHT: 3 info / stat cards (total / in-warranty / expired)
 *  Stacks vertically on mobile. */
const LocationTrafficSignal: React.FC<Props> = () => {
  return (
    <MapFocusGrid>
      {/* LEFT — Camera list */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4'
      >
        <CctvListTrafficSignal />
      </MapOverlayPanel>

      {/* CENTER — Map */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapTrafficSignal />
      </div>

      {/* RIGHT — Info cards */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:h-full min-h-0 flex flex-col'
      >
        <InfoCardTrafficSignal />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationTrafficSignal)
