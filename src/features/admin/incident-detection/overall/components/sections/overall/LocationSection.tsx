"use client"
import React from 'react'
import { CCTVSection, InfoCardSection, MapSection } from '../../../components'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {}

const LocationSection: React.FC<Props> = () => {
  return (
    <MapFocusGrid>
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4'
      >
        <CCTVSection />
      </MapOverlayPanel>
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapSection />
      </div>
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:h-full min-h-0 flex flex-col'
      >
        <InfoCardSection />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationSection)
