"use client"
import React from 'react'

interface Props { }

const TitleSection: React.FC<Props> = () => {
  return (
    <section>
      <h1 className='text-(--yellow)'>Bridge Lighting</h1>
      <p className='text-(--yellow)'>ระบบควบคุมแสงสว่างไฟประดับสะพาน</p>
    </section>
  )
}

export default React.memo<Props>(TitleSection)
