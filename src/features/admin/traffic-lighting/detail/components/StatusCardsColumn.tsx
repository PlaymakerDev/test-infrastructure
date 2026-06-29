"use client"
import React from 'react'
import ElectricalSystemCard from './ElectricalSystemCard'
import StatusInfoCard from './StatusInfoCard'
import { useDetailContext } from '../context'

/** Right column — electrical card + 4 status cards for the OVERVIEW tab. */
const StatusCardsColumn: React.FC = () => {
  const { imei, device, deviceLoaded } = useDetailContext()

  const connectionStatus = !deviceLoaded ? '-' : (device ? (device.is_online ? 'ออนไลน์' : 'ออฟไลน์') : '-')
  const circuitStatus = !deviceLoaded ? '-' : (device ? (device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ') : '-')
  const lc = device?.line_checks
  const leftOk = !deviceLoaded ? '-' : (lc ? (lc.line_check1 && lc.line_check2 ? 'เชื่อมต่อปกติ' : 'สายไฟขาด') : '-')
  const rightOk = !deviceLoaded ? '-' : (lc ? (lc.line_check5 && lc.line_check6 ? 'เชื่อมต่อปกติ' : 'สายไฟขาด') : '-')

  return (
    <div className='flex flex-col gap-3 w-full md:w-[300px] shrink-0'>
      <ElectricalSystemCard />

      <StatusInfoCard
        borderColor='#6666FF'
        titleColor='#6666FF'
        title='สถานะการเชื่อมต่อ'
        status={connectionStatus}
        icon='/images/Lighting/icel1.png'
        subtitle={`IMEI : ${imei || '-'}`}
      />

      <StatusInfoCard
        borderColor='#B066FF'
        titleColor='#B066FF'
        title='สถานะวงจร'
        status={circuitStatus}
        icon='/images/Lighting/icel2.png'
      />

      <StatusInfoCard
        borderColor='#66AEFF'
        titleColor='#66AEFF'
        title='สถานะสายไฟด้านซ้าย'
        status={leftOk}
        icon='/images/Lighting/irs4.png'
      />

      <StatusInfoCard
        borderColor='#E94C4C'
        titleColor='#E94C4C'
        title='สถานะสายไฟด้านขวา'
        status={rightOk}
        icon='/images/Lighting/irs5.png'
      />
    </div>
  )
}

export default React.memo(StatusCardsColumn)
