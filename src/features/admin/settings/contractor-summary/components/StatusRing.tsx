"use client"
import React from 'react'
import { TbTool, TbWifi, TbWifiOff } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import type { DeviceRing } from '../hooks/useContractorDeviceRings'
import { offlinePercent, outOfWarrantyPercent, outOfWarrantyShareText } from '../data/deviceStatus'

interface Props {
  ring: DeviceRing
  /** The นอกเหนือการรับประกัน tab: the arc is the share of the offline devices
   *  that are recorded out of warranty, and the counts are as read. */
  excluded?: boolean
  /** The tab's longest share among the rings of this one's size — the row's
   *  shares all take the size that fits it (`shareSize`). */
  longestShare?: number
}

/** The share in the hole as large as the other tabs' "41%" — "0.2%" and
 *  "100%" are no longer — and a size down for "<0.1%", so it stays inside
 *  the hole over "Not Covered" (two lines in a small ring); measured at 1920
 *  and 390 wide (2026-11-17). */
export const shareSize = (large: boolean, chars: number) =>
  chars <= 4 ? (large ? 'fs-36' : 'fs-18') : large ? 'fs-28' : 'fs-14'

/** One system's ring: the arc is its offline share, drawn in the system's
 *  colour over a dark track — same SVG technique as the maintenance page's
 *  Solution Overview rings. The first three systems get the wide ring. */
const StatusRing: React.FC<Props> = ({ ring, excluded = false, longestShare = 0 }) => {
  const { system } = ring
  const percent = excluded ? outOfWarrantyPercent(ring) : offlinePercent(ring.totals)
  const label = excluded ? outOfWarrantyShareText(ring) : `${percent}%`
  // A record or two among hundreds offline is a fraction of a percent — a
  // pixel of arc; draw at least a sliver, not an empty ring beside a count.
  const arc = excluded && ring.outOfWarranty > 0 ? Math.max(percent, 1) : percent
  const totals = excluded ? ring.raw : ring.totals
  const large = !!system.large
  const size = large ? 190 : 116
  const stroke = large ? 26 : 17
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // A floor, not a fixed width: the one-line title widens its own ring rather
  // than spilling onto the next one ("Incident Detection" is ~205px).
  return (
    <div className='flex flex-col items-center gap-2 shrink-0' style={{ minWidth: large ? 200 : 140 }}>
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
            strokeDasharray={`${(arc / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className='absolute inset-0 flex flex-col items-center justify-center leading-tight' style={{ color: system.color }}>
          <span className={`font-bold ${shareSize(large, excluded ? Math.max(longestShare, label.length) : 0)}`}>{label}</span>
          {/* In English on every tab (user 2026-11-17). fs-12 is the site's
              smallest size (14px), where "Not Covered" is as wide as a small
              ring's hole — kept inside it, it breaks into two lines there. */}
          <span className={`text-center ${large ? 'fs-18' : 'fs-12'}`} style={{ maxWidth: size - 2 * stroke - 8 }}>
            {excluded ? 'Not Covered' : 'Offline'}
          </span>
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
        {!excluded && (
          <p className='fs-14 inline-flex items-center gap-1.5 text-(--light-gray-3)'>
            <TbWifi className='text-(--default-blue)' /> ออนไลน์ <span className='text-(--default-blue)'>{fmtNumber(totals.online)}</span>
          </p>
        )}
        <p className='fs-14 inline-flex items-center gap-1.5 text-(--light-gray-3)'>
          <TbWifiOff className='text-(--red)' /> ออฟไลน์ <span className='text-(--red)'>{fmtNumber(totals.offline)}</span>
        </p>
        {excluded && (
          <p className='fs-14 inline-flex items-center gap-1.5 text-(--light-gray-3) whitespace-nowrap'>
            <TbTool className='text-(--yellow)' /> นอกเหนือการรับประกัน <span className='text-(--yellow)'>{fmtNumber(ring.outOfWarranty)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default React.memo<Props>(StatusRing)
