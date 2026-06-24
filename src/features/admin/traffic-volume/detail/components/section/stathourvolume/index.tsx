"use client"
import React from 'react'

interface Props {}

/** Tab content for "สถิติรายชั่วโมงแยกตามประเภท". Pending design + API. */
const StatHourVolume: React.FC<Props> = () => {
  return (
    <div className='text-white/70'>
      สถิติรายชั่วโมงแยกตามประเภท — เนื้อหากำลังอยู่ระหว่างการพัฒนา
    </div>
  )
}

export default React.memo<Props>(StatHourVolume)
