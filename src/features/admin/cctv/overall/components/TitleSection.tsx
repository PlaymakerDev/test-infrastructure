"use client"
import React from 'react'

interface Props { }

const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-(--yellow)'>CCTV</h1>
      <p className='text-(--yellow)'>ระบบกล้องวงจรปิด</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
