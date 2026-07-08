"use client"
import React from 'react'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'
import VoltageAmpChartsRow from './VoltageAmpChartsRow'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import { useDetailContext } from '../context'

/** OVERVIEW tab layout — remote control card (left) + diagram iframe (center)
 *  + right status column. Below: example cards + map/event section. */
const OverviewSection: React.FC = () => {
  const { imei } = useDetailContext()

  return (
    <div className='w-full flex flex-col'>
      <div className='flex flex-col md:flex-row md:items-stretch w-full gap-3'>
        <div className='shrink-0'>
          <RemoteControlCard />
        </div>

        {/* Center — circuit diagram iframe for this device. */}
        <div className='flex-1 min-w-0 rounded-[20px] overflow-hidden bg-[#191919CC] flex items-center justify-center min-h-[310px]'>
          {imei ? (
            <DiagramIframe imei={imei} minHeight={310} className='h-full' />
          ) : (
            <p className='text-white/50 text-sm m-0'>ไม่มี IMEI — ไม่สามารถแสดงวงจรไฟฟ้าได้</p>
          )}
        </div>

        <StatusCardsColumn />
      </div>
      <VoltageAmpChartsRow imei={imei} />
      <MapEventSection />
    </div>
  )
}

export default React.memo(OverviewSection)
