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

  // The bottom-left placement floats over the diagram, so that variant is sized
  // down a step (narrower, denser padding, smaller value text). The rail
  // placement keeps its original size.
  const isFloating = direction === 'row'

  const connectionStatus = !deviceLoaded ? '-' : (device ? (device.is_online ? 'ออนไลน์' : 'ออฟไลน์') : '-')
  const circuitStatus = !deviceLoaded ? '-' : (device ? (device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ') : '-')

  return (
    <div
      className={
        isFloating
          ? 'flex flex-col md:flex-row gap-2 w-full md:w-auto'
          : 'flex flex-col gap-2.5 w-full'
      }
    >
      <div className={isFloating ? 'w-full md:w-62 shrink-0' : 'w-full'}>
        <StatusInfoCard
          compact
          dense={isFloating}
          borderColor='#6666FF'
          titleColor='#6666FF'
          title='สถานะการเชื่อมต่อ'
          status={connectionStatus}
          icon={`${BASE_PATH}/images/Lighting/icel1.png`}
          subtitle={`IMEI : ${imei || '-'}`}
          valueFontSize={isFloating ? 17 : 20}
        />
      </div>

      <div className={isFloating ? 'w-full md:w-62 shrink-0' : 'w-full'}>
        <StatusInfoCard
          compact
          dense={isFloating}
          borderColor='#B066FF'
          titleColor='#B066FF'
          title='สถานะวงจร'
          status={circuitStatus}
          icon={`${BASE_PATH}/images/Lighting/icel2.png`}
          valueFontSize={isFloating ? 17 : 20}
        />
      </div>
    </div>
  )
}

export default React.memo(ConnectionCircuitCards)
