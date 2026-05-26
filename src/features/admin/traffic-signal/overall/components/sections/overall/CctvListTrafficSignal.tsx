"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { TRAFFIC_SIGNAL_CAMERAS } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {}

/** Left rail — live CCTV camera previews for traffic-signal intersections.
 *  Each card shows the stream, camera code, IP address and 2 pills (phase
 *  + detection mode). */
const CctvListTrafficSignal: React.FC<Props> = () => {
  return (
    <div className='h-full flex flex-col gap-4'>
      {TRAFFIC_SIGNAL_CAMERAS.map((cam) => (
        <div
          key={cam.id}
          className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
        >
          <HLSLivePlayer figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg' />
          <h4 className='camera-code'>{cam.code}</h4>
          <p className='camera-location'>IP Address : {cam.ipAddress}</p>
          <div className='mt-1.5 flex items-center gap-1.5 flex-wrap'>
            {/* Phase pill — blue outline */}
            <span
              className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap'
              style={{ border: '1px solid #66AEFF', color: '#66AEFF' }}
            >
              {cam.phase} Phase
            </span>
            {/* Detection mode pill — yellow for Counting, white for Stopline */}
            <span
              className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap'
              style={{
                border: `1px solid ${cam.detectionMode === 'Counting' ? '#FCD116' : '#FFFFFF'}`,
                color: cam.detectionMode === 'Counting' ? '#FCD116' : '#FFFFFF',
              }}
            >
              {cam.detectionMode}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(CctvListTrafficSignal)
