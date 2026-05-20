"use client"
import React from 'react'
import { TbSparkles } from 'react-icons/tb'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  bridge: BridgeProject
}

/** Bridge work-status card — shown on the left side of the detail page.
 *  Mirrors the "ไฟประดับสะพานแสดงผลล่าสุด" card style from the overall page. */
const BridgeStatusCard: React.FC<Props> = ({ bridge }) => {
  return (
    <div
      className='p-3 flex flex-col gap-1.5 w-full'
      style={{
        borderRadius: 20,
        border: '2px solid rgba(255,255,255,0.7)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(33,33,33,0.92) 90%)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div className='flex items-center gap-2 text-white text-xs font-semibold'>
        <TbSparkles size={24} className='text-white' />
        สถานะการทำงาน
      </div>
      <h2
        className='text-white font-bold leading-none'
        style={{ fontSize: 22 }}
      >
        {bridge.statusText}
      </h2>
      <p
        className='text-white/70 leading-tight'
        style={{ fontSize: 12 }}
      >
        อัพเดตล่าสุด : {bridge.lastUpdate}
      </p>
    </div>
  )
}

export default React.memo<Props>(BridgeStatusCard)
