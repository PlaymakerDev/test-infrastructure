"use client"
import React from 'react'
import ElectricalSystemCard from './ElectricalSystemCard'
import StatusInfoCard from './StatusInfoCard'

const MOCK_IMEI = '860946061754746'

/** Right column — 5 stacked status cards (300px) for the OVERVIEW tab. */
const StatusCardsColumn: React.FC = () => {
  return (
    <div className='flex flex-col gap-3 w-full md:w-[300px] shrink-0'>
      <ElectricalSystemCard />

      <StatusInfoCard
        borderColor='#6666FF'
        titleColor='#6666FF'
        title='สถานะการเชื่อมต่อ'
        status='ออนไลน์'
        icon='/images/Lighting/icel1.png'
        subtitle={`IMEI : ${MOCK_IMEI}`}
      />

      <StatusInfoCard
        borderColor='#B066FF'
        titleColor='#B066FF'
        title='สถานะวงจร'
        status='เชื่อมต่อปกติ'
        icon='/images/Lighting/icel2.png'
      />

      <StatusInfoCard
        borderColor='#66AEFF'
        titleColor='#66AEFF'
        title='สถานะสายไฟด้านซ้าย'
        status='เชื่อมต่อปกติ'
        icon='/images/Lighting/irs4.png'
      />

      <StatusInfoCard
        borderColor='#E94C4C'
        titleColor='#E94C4C'
        title='สถานะสายไฟด้านขวา'
        status='สายไฟขาด'
        icon='/images/Lighting/irs5.png'
      />
    </div>
  )
}

export default React.memo(StatusCardsColumn)
