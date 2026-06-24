"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

// Mock — wired to /analytic later.
interface CameraItem {
  name: string
  ip: string
  events: number
}

const CAMERAS: CameraItem[] = [
  { name: '68TWP-CCO3017-FAI008-จุดที่3-กม.2+650-มุ่งหน้า ทล.331', ip: '192.168.3.170', events: 3 },
  { name: '68TWP-CCO3017-FAI006-จุดที่3-กม.2+650-มุ่งหน้าอนามัย ห้วยพลู', ip: '192.168.3.171', events: 4 },
  { name: '68TWP-CCO3017-FAI008-จุดที่3-กม.2+650-มุ่งหน้าศูนย์พัฒนา', ip: '192.168.3.172', events: 0 },
]

const CameraCard: React.FC<{ cam: CameraItem }> = ({ cam }) => (
  <div className='flex flex-col gap-2 rounded-2xl p-3' style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
    <div className='rounded-lg overflow-hidden' style={{ height: 150 }}>
      <HLSLivePlayer showLiveBadge enableViewportPause style={{ height: 150, display: 'block', pointerEvents: 'none' }} />
    </div>
    <p className='text-blue-400 fs-13 leading-snug line-clamp-2 mb-0' title={cam.name}>{cam.name}</p>
    <div className='flex items-center justify-between gap-2 mt-auto'>
      <span className='fs-11 text-gray-400 truncate'>IP Address : {cam.ip}</span>
      <span
        className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-11 whitespace-nowrap shrink-0'
        style={{ border: '1px solid #2EE59D', color: '#2EE59D' }}
      >
        {cam.events} เหตุการณ์
      </span>
    </div>
  </div>
)

/** Bottom — camera cards with per-camera event count. */
const CameraList: React.FC = () => (
  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
    {CAMERAS.map((cam, i) => <CameraCard key={i} cam={cam} />)}
  </div>
)

export default React.memo(CameraList)
