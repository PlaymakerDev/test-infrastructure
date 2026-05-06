"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void;
}

const OPTIONS = [
  {
    label: 'ภาพรวม',
    value: 'OVERALL'
  },
  {
    label: 'สถานีตรวจสอบน้ำหนัก',
    value: 'STATION'
  },
  {
    label: 'WIM (Weigh-In-Motion)',
    value: 'WIM'
  },
  {
    label: 'ตรวจสอบน้ำหนักเคลื่อนที่',
    value: 'MOBILE'
  },
  {
    label: 'ติดตาม GPS',
    value: 'TRACK_GPS'
  },
  {
    label: 'ค้นหาป้ายทะเบียน',
    value: 'LICENSE'
  },
]

const TitleSection: React.FC<Props> = (props) => {
  const { setCurrentTab } = props

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>Tracking</h1>
        <p className='text-(--yellow)'>ระบบติดตามและตรวจสอบยานพาหนะ</p>
      </section>
      <section className='mt-5'>
        <SwapButton
          options={OPTIONS}
          defaultActive="OVERALL"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
