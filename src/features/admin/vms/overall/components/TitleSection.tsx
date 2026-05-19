"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void;
}

const OPTIONS = [
  {
    label: 'ควบคุมป้าย VMS',
    value: 'VMS'
  },
  {
    label: 'กำหนดการแสดงผล',
    value: 'DISPLAY'
  },
]

const TitleSection: React.FC<Props> = (props) => {
  const { setCurrentTab } = props

  return (
    <div className='px-10'>
      <section>
        <h1 className='text-(--yellow)'>ควบคุมป้ายอัจริยะ</h1>
        <p className='text-(--yellow)'>ระบบจัดการป้าย VMS ระยะไกล</p>
      </section>
      <section className='mt-5'>
        <SwapButton
          options={OPTIONS}
          defaultActive="VMS"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
