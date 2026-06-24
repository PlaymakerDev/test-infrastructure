"use client"
import React from 'react'
import StatHourVolume from './section/stathourvolume'

interface Props {}

/** Top-level wrapper for the "สถิติรายชั่วโมงแยกตามประเภท" tab. */
const StatHourVolumeSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      <StatHourVolume />
    </div>
  )
}

export default React.memo<Props>(StatHourVolumeSection)
