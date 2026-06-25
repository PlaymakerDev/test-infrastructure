"use client"
import React from 'react'

interface Props {
  /** Border + value color. */
  color: string
  value: React.ReactNode
  /** Primary label (e.g. "95th Percentile"). */
  label: string
  /** Optional sublabel (unit / parenthetical, e.g. "กิโลเมตร / ชั่วโมง"). */
  sublabel?: React.ReactNode
}

/** Small colored stat card — used 4-per-row above each analysis panel's
 *  body. Border + value pick up the accent color so the row reads at a glance. */
const MiniStatCard: React.FC<Props> = ({ color, value, label, sublabel }) => (
  <div
    className='py-3 px-4 rounded-lg flex flex-col items-center justify-center text-center min-h-[88px]'
    style={{
      border: `1.5px solid ${color}`,
      // 10%-opacity tint of the accent color (the `1A` hex suffix). Keeps
      // the background visually tied to the border without overpowering
      // the value text.
      background: `${color}1A`,
    }}
  >
    <span
      className='font-bold leading-none mb-1'
      style={{ color, fontSize: 22 }}
    >
      {value}
    </span>
    <span className='fs-12 text-white/85 leading-tight'>{label}</span>
    {sublabel && (
      <span className='fs-11 text-white/50 leading-tight mt-0.5'>
        {sublabel}
      </span>
    )}
  </div>
)

export default React.memo<Props>(MiniStatCard)
