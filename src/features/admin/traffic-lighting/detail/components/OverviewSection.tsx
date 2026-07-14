"use client"
import React, { useEffect, useRef, useState } from 'react'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'
import VoltageAmpChartsRow from './VoltageAmpChartsRow'
import { useDetailContext } from '../context'

/** Diagram iframe fills its card. The viewer's fixed-res mode (w/h params)
 *  forces a small canvas hugging the top-left; instead we feed it the card's
 *  live pixel size via w/h so the SVG (which has a viewBox) scales to fill. */
const DiagramIframe: React.FC<{ imei: string }> = ({ imei }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setSize({ w: Math.round(cr.width), h: Math.round(cr.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const url = size
    ? `${process.env.NEXT_PUBLIC_HOST_BACKEND}/lighting/diagram/view/${imei}?w=${size.w}&h=${size.h}`
    : ''

  return (
    <div ref={wrapRef} className='w-full h-full min-h-[310px]'>
      {url ? (
        <iframe
          key={url}
          src={url}
          title='วงจรไฟฟ้า'
          style={{ width: '100%', height: '100%', minHeight: 310, border: 0, display: 'block' }}
          loading='lazy'
        />
      ) : null}
    </div>
  )
}

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
        <div className='flex-1 min-w-0 rounded-2xl overflow-hidden bg-[#191919CC] flex items-center justify-center min-h-[310px]'>
          {imei ? (
            <DiagramIframe imei={imei} />
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
