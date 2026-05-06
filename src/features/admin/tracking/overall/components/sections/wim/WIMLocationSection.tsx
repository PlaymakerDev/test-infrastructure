"use client"
import React from 'react'
import { WIMCCTVList, WIMMap, WIMMobileCameraList, WIMSearchPanel } from '@/features/admin/tracking/overall/components'
import '@/styles/map.css'

const WIMLocationSection = () => {
  return (
    <div className='location-section'>

      {/* Left — CCTV list */}
      <div className='camera-list'>
        <WIMCCTVList />
      </div>

      {/* Left — Mobile camera list */}
      <div className="mobile-cam-list">
        <WIMMobileCameraList />
      </div>

      {/* Center — Map */}
      <div className='map-wrapper'>
        <WIMMap />
      </div>

      {/* Right — Search / stats panel */}
      <div className='search-panel'>
        <WIMSearchPanel />
      </div>

    </div>
  )
}

export default React.memo(WIMLocationSection)
