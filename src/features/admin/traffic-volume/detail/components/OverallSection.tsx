"use client"
import React from 'react'
import OverallTrafficVolume from './section/overall'

interface Props {}

/** Top-level wrapper for the "ภาพรวม" tab. Composes sub-components from
 *  `section/overall/`. */
const OverallSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      <OverallTrafficVolume />
    </div>
  )
}

export default React.memo<Props>(OverallSection)
