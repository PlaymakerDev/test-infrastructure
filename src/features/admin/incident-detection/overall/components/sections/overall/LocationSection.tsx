"use client"
import React from 'react'
import { CCTVSection, InfoCardSection, MapSection } from '../../../components'

interface Props {}

const LocationSection: React.FC<Props> = () => {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 lg:h-[75dvh]'>
      <div className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4'>
        <CCTVSection />
      </div>
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapSection />
      </div>
      <div className='row-start-3 lg:row-start-1 lg:col-start-3 lg:h-full min-h-0 flex flex-col'>
        <InfoCardSection />
      </div>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
