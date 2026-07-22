"use client"
import React from 'react'
import { InfoCardSection, MapSection } from '../../../components'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {

}

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex flex-col gap-4 xl:block xl:relative'>

      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-180'>
        <MapSection />
      </div>

      {/* Info panel: in flow on mobile, anchored top-right on desktop.
        * Width/breakpoint mirror traffic-volume's overlay so the cards size identically. */}
      <MapOverlayPanel
        position='right'
        className='px-10 xl:px-0 xl:absolute xl:top-4 xl:right-4 xl:bottom-4 xl:z-10 xl:w-90'
      >
        <InfoCardSection />
      </MapOverlayPanel>

    </div>
  )
}

export default React.memo<Props>(LocationSection)
