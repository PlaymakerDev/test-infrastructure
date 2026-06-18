"use client"
import React from 'react'

interface Props { }

const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-[20px] sm:text-[24px] font-bold text-(--yellow)'>Traffic Lighting</h1>
      <p className='text-[13px] sm:text-[14px] text-(--yellow)'>ระบบตรวจสอบการจราจรบนสายทางและแจ้งเตือนไฟฟ้าส่องสว่าง</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
