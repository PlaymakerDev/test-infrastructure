"use client"
import React from 'react'
import StatusInfoCard from './StatusInfoCard'
import { useDetailContext } from '../context'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

interface Props {
  /** `column` — stacked in the right rail (default, collapsed layout).
   *  `row` — side by side, used when they relocate to the bottom-left corner
   *  while ElectricalSystemCard is expanded. */
  direction?: 'column' | 'row'
}

/** Connection + circuit status pair. Extracted from StatusCardsColumn so the
 *  same two cards can be rendered either in the right rail or, once the
 *  electrical card expands and takes over that rail, in the empty bottom-left
 *  area — without duplicating the card definitions in two places. */
const ConnectionCircuitCards: React.FC<Props> = ({ direction = 'column' }) => {
  const { imei, device, deviceLoaded } = useDetailContext()

  const connectionStatus = !deviceLoaded ? '-' : (device ? (device.is_online ? 'ออนไลน์' : 'ออฟไลน์') : '-')
  const circuitStatus = !deviceLoaded ? '-' : (device ? (device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ') : '-')

  return (
    <div
      className={
        direction === 'row'
          // Each card keeps the rail's 300px width so the pair reads as the
          // same component that was just moved, not a resized variant.
          ? 'flex flex-col md:flex-row gap-2.5 w-full md:w-auto'
          : 'flex flex-col gap-2.5 w-full'
      }
    >
      <div className={direction === 'row' ? 'w-full md:w-[300px] shrink-0' : 'w-full'}>
        <StatusInfoCard
          compact
          borderColor='#6666FF'
          titleColor='#6666FF'
          title='สถานะการเชื่อมต่อ'
          status={connectionStatus}
          icon={`${BASE_PATH}/images/Lighting/icel1.png`}
          subtitle={`IMEI : ${imei || '-'}`}
          valueFontSize={20}
        />
      </div>

      <div className={direction === 'row' ? 'w-full md:w-[300px] shrink-0' : 'w-full'}>
        <StatusInfoCard
          compact
          borderColor='#B066FF'
          titleColor='#B066FF'
          title='สถานะวงจร'
          status={circuitStatus}
          icon={`${BASE_PATH}/images/Lighting/icel2.png`}
          valueFontSize={20}
        />
      </div>
    </div>
  )
}

export default React.memo(ConnectionCircuitCards)
