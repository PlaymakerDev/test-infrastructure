"use client"
import React from 'react'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface Props {
  /** [0] = ทำงาน (blue arc), [1] = ไม่ทำงาน (red arc) */
  segments: [DonutSegment, DonutSegment]
  centerValue: string
  centerLabel?: string
  size?: number
}

/** Donut + side stats — ไม่ทำงาน (left) | donut | ทำงาน (right), aligned to Figma. */
const DonutChart: React.FC<Props> = ({
  segments,
  centerValue,
  centerLabel,
  size = 165,
}) => {
  const [working, notWorking] = segments
  const total = working.value + notWorking.value || 1
  const stroke = 26
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offset = 0
  const arcs = [working, notWorking].map((seg) => {
    const fraction = seg.value / total
    const dash = fraction * circumference
    const arc = { ...seg, dash, gap: circumference - dash, offset: -offset }
    offset += dash
    return arc
  })

  const pct = (value: number) => `${((value / total) * 100).toFixed(1)}%`

  const SideStat: React.FC<{ seg: DonutSegment; align: 'left' | 'right' }> = ({ seg, align }) => (
    <div
      className={`flex flex-col justify-center gap-0.5 min-h-0 ${
        align === 'right' ? 'items-end text-right pr-1' : 'items-start text-left pl-1'
      }`}
      style={{ minHeight: size }}
    >
      <span className='text-[14px] font-normal leading-snug' style={{ color: seg.color }}>
        {seg.label}
      </span>
      <span className='text-[14px] font-normal text-white leading-snug whitespace-nowrap'>
        {seg.value} ({pct(seg.value)})
      </span>
    </div>
  )

  return (
    <div className='flex w-full items-center'>
      <div className='flex-1 min-w-0 flex justify-end'>
        <SideStat seg={notWorking} align='right' />
      </div>

      <div className='relative shrink-0 mx-2' style={{ width: size, height: size }}>
        <svg width={size} height={size} className='block -rotate-90'>
          <circle cx={cx} cy={cy} r={r} fill='none' stroke='#2B2B2B' strokeWidth={stroke} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill='none'
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap='butt'
            />
          ))}
        </svg>
        <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
          <span className='text-[32px] font-bold leading-none' style={{ color: '#05F2DB' }}>
            {centerValue}
          </span>
          {centerLabel && (
            <span className='text-[12px] font-normal text-white mt-1 leading-none'>
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <div className='flex-1 min-w-0 flex justify-start'>
        <SideStat seg={working} align='left' />
      </div>
    </div>
  )
}

export default React.memo(DonutChart)
