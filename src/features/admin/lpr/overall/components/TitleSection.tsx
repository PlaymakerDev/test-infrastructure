"use client"
// import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void;
}

// const OPTIONS = [
//   {
//     label: 'LPR',
//     value: 'LPR'
//   },
//   {
//     label: 'ค้นหาป้ายทะเบียนรายคัน',
//     value: 'LICENSE'
//   },
// ]

const TitleSection: React.FC<Props> = (props) => {
  // const { setCurrentTab } = props

  return (
    <div className='px-10'>
      <section>
        <h1 className='text-(--yellow)'>ตรวจจับป้ายทะเบียน</h1>
        <p className='text-(--yellow)'>ระบบจดจำป้ายทะเบียนยานพาหนะ (ANPR)</p>
      </section>
      {/* <section className='mt-5'>
        <SwapButton
          options={OPTIONS}
          defaultActive="LPR"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section> */}
    </div>
  )
}

export default React.memo<Props>(TitleSection)
