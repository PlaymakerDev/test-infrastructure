"use client"
import React from 'react'
import { InfoCardSection, MapSection } from '../../../components'
import ActiveCamera from './ActiveCamera'
import VMSScreen from './VMSScreen'
import WeatherChart from './WeatherChart'

interface Props { }

const LocationSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-4 lg:block lg:relative'>
      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-[75dvh]'>
        <MapSection />
      </div>

      {/* InfoCardSection: in flow on mobile, anchored top-left on desktop */}
      <div className='px-10 lg:px-0 lg:absolute lg:top-0 lg:left-4 lg:z-10 lg:w-[clamp(26rem,28vw,48rem)]'>
        <InfoCardSection />
      </div>

      {/* WeatherChart: in flow on mobile, anchored bottom-left on desktop */}
      <div className='px-10 lg:px-0 lg:absolute lg:bottom-0 lg:left-4 lg:z-10 lg:w-[clamp(32rem,45vw,52rem)]'>
        <WeatherChart />
      </div>

      {/* Right column: VMSScreen + ActiveCamera, spans full height on desktop */}
      <div className='flex flex-col gap-4 px-10 lg:px-0 lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:z-10 lg:w-[clamp(26rem,28vw,48rem)]'>
        <VMSScreen />
        <ActiveCamera />
      </div>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
