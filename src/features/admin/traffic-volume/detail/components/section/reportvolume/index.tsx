"use client"
import React from 'react'

interface Props {}

/** Tab content for "รายงานการนับปริมาณจราจร". Pending design + API. */
const ReportVolume: React.FC<Props> = () => {
  return (
    <div className='text-white/70'>
      รายงานการนับปริมาณจราจร — เนื้อหากำลังอยู่ระหว่างการพัฒนา
    </div>
  )
}

export default React.memo<Props>(ReportVolume)
