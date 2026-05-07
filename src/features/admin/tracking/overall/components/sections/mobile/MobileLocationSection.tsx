"use client"
import React from 'react'
import {
  MobileMap,
  MobileSearchPanel,
  MobileStationData
} from '@/features/admin/tracking/overall/components'

const MobileLocationSection = () => {
  return (
    <div className='location-section'>

      {/* Left — Station data */}
      <div className='station-list'>
        <MobileStationData />
        {/* <WIMCCTVList /> */}
      </div>

      {/* Center — Map */}
      <div className='map-wrapper'>
        <MobileMap />
      </div>

      {/* Right — Search / stats panel */}
      <div className='search-panel'>
        <MobileSearchPanel />
      </div>

    </div>
  )
}

export default React.memo(MobileLocationSection)
