"use client"
import React from 'react'
import { MapBridgeLighting } from '../../../components'
import InfoCardSection from './InfoCardSection'
import LatestDisplay from './LatestDisplay'

interface Props { }

const LocationSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-4 lg:block lg:relative'>
      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-[75dvh]'>
        <MapBridgeLighting edgeFade={{ all: 10 }} />
      </div>

      {/* LatestDisplay: top-left, compact */}
      <div className='lg:px-0 lg:absolute lg:top-4 lg:left-0 lg:z-10 lg:w-[clamp(18rem,23vw,28rem)]'>
        <LatestDisplay />
      </div>

      {/* InfoCardSection: top-right, 3 stat cards stacked */}
      <div className='lg:px-0 lg:absolute lg:top-4 lg:right-0 lg:z-10 lg:w-[clamp(16rem,18vw,22rem)]'>
        <InfoCardSection />
      </div>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
