"use client"
import React from 'react'
import CctvListTrafficVolume from './CctvListTrafficVolume'
import MapTrafficVolume from './MapTrafficVolume'
import InfoCardTrafficVolume from './InfoCardTrafficVolume'

interface Props {}

/** Top-area layout — 3 columns on desktop:
 *  • LEFT: CCTV / sensor camera preview list
 *  • CENTER: Thailand map with traffic-volume station markers
 *  • RIGHT: 3 info / stat cards (total / in-warranty / expired)
 *  Stacks vertically on mobile. */
const LocationTrafficVolume: React.FC<Props> = () => {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 lg:h-[75dvh]'>
      {/* LEFT — Camera list */}
      <div className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'>
        <CctvListTrafficVolume />
      </div>

      {/* CENTER — Map */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapTrafficVolume />
      </div>

      {/* RIGHT — Info cards */}
      <div className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'>
        <InfoCardTrafficVolume />
      </div>
    </div>
  )
}

export default React.memo<Props>(LocationTrafficVolume)
