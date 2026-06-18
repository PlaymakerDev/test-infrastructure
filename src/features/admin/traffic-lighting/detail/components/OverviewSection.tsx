"use client"
import React from 'react'
import ExampleCardsRow from './ExampleCardsRow'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'

/** OVERVIEW tab layout — remote control card + right status column. */
const OverviewSection: React.FC = () => {
  return (
    <div className='w-full flex flex-col'>
      <div className='flex flex-col md:flex-row md:justify-between md:items-start w-full gap-3'>
        <div className='shrink-0'>
          <RemoteControlCard />
        </div>
        <StatusCardsColumn />
      </div>
      <ExampleCardsRow />
      <MapEventSection />
    </div>
  )
}

export default React.memo(OverviewSection)
