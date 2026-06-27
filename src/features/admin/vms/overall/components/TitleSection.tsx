"use client"
import React from 'react'

interface Props {}

const TitleSection: React.FC<Props> = () => {
  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>VMS</h1>
        <p className='text-(--yellow)'>ระบบป้ายปรับเปลี่ยนข้อความ</p>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
