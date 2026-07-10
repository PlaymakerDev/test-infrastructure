"use client"
import React from 'react'
import { CCTVSection, InfoCardSection, MapCrosswalk } from '../../../components'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {

}

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <MapFocusGrid>

      {/* Camera list — row 2 on mobile, col 1 on desktop */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <CCTVSection />
      </MapOverlayPanel>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapCrosswalk />
      </div>

      {/* Info panel — row 3 on mobile, col 3 on desktop */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <InfoCardSection />
      </MapOverlayPanel>

    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationSection)
