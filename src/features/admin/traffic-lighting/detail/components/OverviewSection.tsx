"use client"
import React from 'react'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'
import VoltageAmpChartsRow from './VoltageAmpChartsRow'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import { useDetailContext } from '../context'

/** OVERVIEW tab layout — full-size diagram iframe with the remote control
 *  card (top-left) and status column (top-right) floating on top of it, like
 *  the overall page's map + corner stat cards. Below: charts + map/event
 *  section. */
const OverviewSection: React.FC = () => {
  const { imei } = useDetailContext()

  return (
    <div className='w-full flex flex-col'>
      <div className='relative flex flex-col gap-3 md:min-h-[650px]'>
        <div className='w-full md:w-[429px] md:absolute md:top-0 md:left-0 md:z-10'>
          <RemoteControlCard />
        </div>

        {/* Center — circuit diagram iframe for this device. */}
        <div className='flex-1 min-w-0 rounded-2xl overflow-hidden bg-[#191919CC] flex items-stretch justify-center min-h-[310px]'>
          {imei ? (
            // `items-stretch` (not `items-center`) on the parent so the
            // iframe fills the full card instead of hugging its own content
            // height — the viewer itself centers the circuit graphic inside
            // whatever canvas size it's given.
            <DiagramIframe imei={imei} minHeight={400} />
          ) : (
            <p className='text-white/50 text-sm m-0 self-center'>ไม่มี IMEI — ไม่สามารถแสดงวงจรไฟฟ้าได้</p>
          )}
        </div>

        <div className='w-full md:w-[300px] md:absolute md:top-0 md:right-0 md:z-10'>
          <StatusCardsColumn />
        </div>
      </div>
      <VoltageAmpChartsRow imei={imei} />
      <MapEventSection />
    </div>
  )
}

export default React.memo(OverviewSection)
