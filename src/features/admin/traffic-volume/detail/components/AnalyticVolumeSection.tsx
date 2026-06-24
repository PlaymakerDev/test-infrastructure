"use client"
import React from 'react'
import AnalyticVolume from './section/analyticvolume'

interface Props {}

/** Top-level wrapper for the "วิเคราะห์ปริมาณจราจร" tab. */
const AnalyticVolumeSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      <AnalyticVolume />
    </div>
  )
}

export default React.memo<Props>(AnalyticVolumeSection)
