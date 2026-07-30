"use client"
import React from 'react'
import CctvListTrafficSignal from './CctvListTrafficSignal'
import MapTrafficSignal from './MapTrafficSignal'
import InfoCardTrafficSignal from './InfoCardTrafficSignal'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  roadId?: string | null
}

/** Top-area layout — 3 columns on desktop:
 *  • LEFT: CCTV camera preview list
 *  • CENTER: Thailand map with traffic-signal markers
 *  • RIGHT: 3 info / stat cards (total / in-warranty / expired)
 *  Stacks vertically on mobile. */
const LocationTrafficSignal: React.FC<Props> = (props) => {
  const { roadId } = props

  return (
    // LEFT rail widened 280→320px (other menus keep the 280 default): the
    // camera cards show "IP : x.x.x.x" + phase/type pills on ONE row at the
    // original font sizes, and the longest IPs (e.g. 10.101.200.193) need the
    // extra room to not wrap.
    <MapFocusGrid desktopCols='320px minmax(0, 1fr) 280px'>
      {/* LEFT — Camera list */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4'
      >
        <CctvListTrafficSignal
          roadId={roadId}
        />
      </MapOverlayPanel>

      {/* CENTER — Map */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapTrafficSignal
          roadId={roadId}
        />
      </div>

      {/* RIGHT — Info cards */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:h-full min-h-0 flex flex-col'
      >
        <InfoCardTrafficSignal
          roadId={roadId}
        />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationTrafficSignal)
