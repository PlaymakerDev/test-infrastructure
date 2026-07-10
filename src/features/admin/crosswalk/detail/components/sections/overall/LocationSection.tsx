"use client"
import React from 'react'
import { InfoCardSection, MapSection } from '../../../components'

interface Props {

}

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex flex-col gap-4 lg:block lg:relative'>

      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-[75dvh]'>
        <MapSection />
      </div>

      {/* Info panel: in flow on mobile, anchored top-right on desktop */}
      <div className='flex flex-col gap-4 px-10 lg:px-0 lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:z-10 lg:w-70'>
        <InfoCardSection />
      </div>

    </div>
  )
}

export default React.memo<Props>(LocationSection)
