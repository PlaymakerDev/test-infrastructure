"use client"
import React from 'react'
import SwapButton from '@/components/swap-button/SwapButton'

const HEADER_OPTIONS = [
  { label: 'ฝ่ายคุมป้าย VMS', value: 'vms' },
  { label: 'ประวัติและการแจ้งเตือน', value: 'history' },
]

interface Props {
  onTabChange: (value: string) => void
}

const HeaderVms: React.FC<Props> = ({ onTabChange }) => {
  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>ควบคุมป้ายอัจฉริยะ</h1>
        <p className='text-(--yellow)'>ระบบจัดการป้าย VMS ระยะไกล</p>
      </section>
      <section className='mt-5'>
        <SwapButton
          options={HEADER_OPTIONS}
          defaultActive='vms'
          setLabelValue={onTabChange}
        />
      </section>
    </div>
  )
}

export default React.memo(HeaderVms)
