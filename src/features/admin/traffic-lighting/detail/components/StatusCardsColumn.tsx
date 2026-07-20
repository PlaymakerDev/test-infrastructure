"use client"
import React from 'react'
import ElectricalSystemCard from './ElectricalSystemCard'
import StatusInfoCard from './StatusInfoCard'
import { useDetailContext } from '../context'

/** Right column — electrical card + connection/circuit status for the OVERVIEW tab. */
const StatusCardsColumn: React.FC = () => {
  const { imei, device, deviceLoaded } = useDetailContext()

  const connectionStatus = !deviceLoaded ? '-' : (device ? (device.is_online ? 'ออนไลน์' : 'ออฟไลน์') : '-')
  const circuitStatus = !deviceLoaded ? '-' : (device ? (device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ') : '-')

  return (
    <div className='flex flex-col gap-2.5 w-full md:w-[300px] shrink-0 md:self-start'>
      <ElectricalSystemCard />

      <StatusInfoCard
        compact
        borderColor='#6666FF'
        titleColor='#6666FF'
        title='สถานะการเชื่อมต่อ'
        status={connectionStatus}
        icon='/atlas/images/Lighting/icel1.png'
        subtitle={`IMEI : ${imei || '-'}`}
        valueFontSize={20}
      />

      <StatusInfoCard
        compact
        borderColor='#B066FF'
        titleColor='#B066FF'
        title='สถานะวงจร'
        status={circuitStatus}
        icon='/atlas/images/Lighting/icel2.png'
        valueFontSize={20}
      />
    </div>
  )
}

export default React.memo(StatusCardsColumn)
