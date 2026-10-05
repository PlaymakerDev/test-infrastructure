"use client"
import React from 'react'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import type { DeviceTotals } from '@/types/manage/device-status-api'
import type { SummarySystem } from '../data/systems'
import { offlinePercent } from '../data/deviceStatus'

interface Props {
  system: SummarySystem
  totals: DeviceTotals
}

/** One system's ring: the arc is its offline share, drawn in the system's
 *  colour over a dark track — same SVG technique as the maintenance page's
 *  Solution Overview rings. The first three systems get the wide ring. */
const StatusRing: React.FC<Props> = ({ system, totals }) => {
  const percent = offlinePercent(totals)
  const large = !!system.large
  const size = large ? 190 : 116
  const stroke = large ? 26 : 17
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className='flex flex-col items-center gap-2 shrink-0' style={{ width: large ? 200 : 140 }}>
      <div className='relative' style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='-rotate-90' aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke='var(--dark-black)' strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke={system.color}
            strokeWidth={stroke}
            strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className='absolute inset-0 flex flex-col items-center justify-center leading-tight' style={{ color: system.color }}>
          <span className={`font-bold ${large ? 'fs-36' : 'fs-18'}`}>{percent}%</span>
          {/* fs-12 is the site's smallest size (14px). */}
          <span className={large ? 'fs-18' : 'fs-12'}>Offline</span>
        </div>
      </div>
      <p className='fs-22 font-bold text-center whitespace-nowrap' style={{ color: system.color }}>
        {system.label}
      </p>
      {/* fs on each <p>: globals.css sizes every p itself, so a class on the
          wrapper never reached them. */}
      <div className='flex flex-col items-center gap-1'>
        <p className='fs-14 text-(--light-gray-3)'>
          ทั้งหมด <span className='text-(--yellow)'>{fmtNumber(totals.total)}</span>
        </p>
        <p className='fs-14 inline-flex items-center gap-1.5 text-(--light-gray-3)'>
          <TbWifi className='text-(--default-blue)' /> ออนไลน์ <span className='text-(--default-blue)'>{fmtNumber(totals.online)}</span>
        </p>
        <p className='fs-14 inline-flex items-center gap-1.5 text-(--light-gray-3)'>
          <TbWifiOff className='text-(--red)' /> ออฟไลน์ <span className='text-(--red)'>{fmtNumber(totals.offline)}</span>
        </p>
      </div>
    </div>
  )
}

export default React.memo<Props>(StatusRing)
