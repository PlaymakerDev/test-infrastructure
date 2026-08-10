"use client"
import React from 'react'

interface Props { }

/** Page header — bare `h1`/`p` on the global type scale, identical to
 *  traffic-volume's TitleSection. The old bespoke `text-[20px] sm:text-[24px]`
 *  + `fs-12` overrides made this header smaller than every other menu's (and
 *  the fs-12 subtitle was being forced back up to 14px by
 *  TrafficLightingMinimumFontSize anyway). */
const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-(--yellow)'>Traffic Lighting</h1>
      <p className='text-(--yellow)'>ระบบตรวจสอบการจราจรบนสายทางและแจ้งเตือนไฟฟ้าส่องสว่าง</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
