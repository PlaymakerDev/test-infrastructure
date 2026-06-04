"use client"
import React from 'react'
import MapDetailBridgeLighting from './sections/overall/MapDetailBridgeLighting'
import ChartElectricalBridgeLighting from './sections/overall/ChartElectricalBridgeLighting'
import MadrixControlPanel from '@/features/admin/bridge-lighting/overall/components/sections/overall/MadrixControlPanel'
import BridgeLightingStatus from './sections/overall/BridgeLightingStatus'
import VoltageStat from './sections/overall/VoltageStat'

const OverallSection: React.FC = () => {
  return (
    <div className='flex flex-col gap-4 lg:block lg:relative lg:h-full'>
      {/* Map: full-width background; defines container height on desktop via h-full */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapDetailBridgeLighting edgeFade={{ all: 30 }} />
      </div>

      {/* Right column: stats then charts, spans full height on desktop */}
      <div className='flex flex-col gap-3 px-10 lg:px-0 lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:z-10 lg:w-[clamp(30rem,38vw,52rem)]'>
        <div className='shrink-0'>
          <VoltageStat />
        </div>
        <div className='flex-1 min-h-0'>
          <ChartElectricalBridgeLighting />
        </div>
      </div>

      {/* Left column: BridgeLightingStatus — natural height, anchored bottom-left */}
      <div className='px-10 lg:px-0 lg:absolute lg:bottom-4 lg:left-4 lg:z-10 lg:w-[clamp(20rem,22vw,28rem)]'>
        <BridgeLightingStatus />
      </div>

      {/* Center: MADRIX panel — defined height, anchored bottom-center */}
      <div className='flex flex-col px-10 lg:px-0 lg:absolute lg:bottom-4 lg:left-[calc(clamp(20rem,22vw,28rem)+2rem)] lg:right-[calc(clamp(30rem,38vw,52rem)+2rem)] lg:z-10'>
        <MadrixControlPanel />
      </div>
    </div>
  )
}

export default React.memo(OverallSection)
