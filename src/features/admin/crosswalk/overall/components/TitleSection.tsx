"use client"
import React from 'react'

interface Props {
}

const TitleSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>Crosswalk</h1>
        <p className='text-(--yellow)'>ระบบสัญญาณไฟทางข้ามอัจฉริยะ</p>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
