"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void;
}

const OPTIONS = [
  {
    label: 'โครงการ',
    value: 'PROJECT'
  },
  {
    label: 'สายทาง',
    value: 'ROUTE'
  },
  {
    label: 'ผู้รับจ้าง',
    value: 'CONTACT'
  },
  {
    label: 'ผู้ใช้งาน',
    value: 'USER'
  },

]

const TitleSection: React.FC<Props> = (props) => {
  const { setCurrentTab } = props

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>ระบบและการตั้งค่า</h1>
        <p className='text-(--yellow)'>การจัดการข้อมูลพื้นฐานของระบบ</p>
      </section>
      <section className='mt-5'>
        <SwapButton
          options={OPTIONS}
          defaultActive="PROJECT"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
