"use client"
import React from 'react'

interface Props {}

const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-(--yellow)'>Traffic Signal</h1>
      <p className='text-(--yellow)'>ระบบสัญญาณไฟจราจรอัจฉริยะ</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
