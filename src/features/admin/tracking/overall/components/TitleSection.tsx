"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useOverallContext } from '../context'

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
    label: 'WIM (Weight-In-Motion)',
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
]

const TitleSection: React.FC = () => {
  const { currentTab, setCurrentTab } = useOverallContext()
  const router = useRouter()

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>Truck Tracking</h1>
        <p className='text-(--yellow)'>ระบบติดตามและตรวจสอบยานพาหนะ</p>
      </section>
      <section className='mt-5'>
        <SwapButton
          options={OPTIONS}
          activeValue={currentTab}
          setLabelValue={(value) => {
            // GPS has no inline content — it's a shortcut into its own detail
            // route, not a real overview tab, so it must never become
            // `currentTab` (that would get persisted to the URL and loop:
            // back-navigation would land on ?tab=TRACK_GPS and redirect
            // straight back into the same detail page).
            if (value === 'TRACK_GPS') {
              router.push('/admin/tracking/detail/gps')
              return
            }
            setCurrentTab(value)
          }}
        />
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
