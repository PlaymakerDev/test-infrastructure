"use client"
import React from 'react'
import CctvListTrafficVolume from './CctvListTrafficVolume'
import MapTrafficVolume from './MapTrafficVolume'
import InfoCardTrafficVolume from './InfoCardTrafficVolume'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  roadId?: string | null
}

/** Top-area layout — 3 columns on desktop:
 *  • LEFT: CCTV / sensor camera preview list
 *  • CENTER: Thailand map with traffic-volume station markers
 *  • RIGHT: 3 info / stat cards (total / in-warranty / expired)
 *  Stacks vertically on mobile. */
const LocationTrafficVolume: React.FC<Props> = ({ roadId }) => {
  return (
    <MapFocusGrid>
      {/* LEFT — Camera list */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <CctvListTrafficVolume
          roadId={roadId}
        />
      </MapOverlayPanel>

      {/* CENTER — Map */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapTrafficVolume
          roadId={roadId}
        />
      </div>

      {/* RIGHT — Info cards */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <InfoCardTrafficVolume
          roadId={roadId}
        />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationTrafficVolume)
