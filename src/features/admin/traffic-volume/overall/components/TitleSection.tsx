"use client"
import React from 'react'

interface Props { }

const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-(--yellow)'>Traffic Volume</h1>
      <p className='text-(--yellow)'>ระบบวิเคราะห์ภาพจากกล้องโทรทัศน์วงจรปิดเพื่อตรวจจับปริมาณจราจรและแยกประเภทของรถ</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
