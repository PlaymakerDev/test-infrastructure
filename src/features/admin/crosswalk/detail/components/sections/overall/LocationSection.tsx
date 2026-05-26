"use client"
import React from 'react'
import { InfoCardSection, MapSection } from '../../../components'

interface Props {

}

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 lg:h-[75dvh]'>

      {/* Map — row 1 on mobile, col 1 on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapSection />
      </div>

      {/* Info panel — row 2 on mobile, col 2 on desktop */}
      <div className='lg:overflow-y-auto lg:h-full flex flex-col gap-4'>
        <InfoCardSection />
      </div>

    </div>
  )
}

export default React.memo<Props>(LocationSection)
