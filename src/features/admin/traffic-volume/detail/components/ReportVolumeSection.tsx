"use client"
import React from 'react'
import ReportVolume from './section/reportvolume'

interface Props {}

/** Top-level wrapper for the "รายงานการนับปริมาณจราจร" tab. */
const ReportVolumeSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      <ReportVolume />
    </div>
  )
}

export default React.memo<Props>(ReportVolumeSection)
