"use client"
import React from 'react'

export interface AnalyticStatRow {
  label: string
  value: React.ReactNode
  /** When true, the value is rendered in the card's accent color (the
   *  "featured" row per card). Otherwise renders in white. */
  highlight?: boolean
}

export interface AnalyticStatCardProps {
  icon: React.ReactNode
  title: string
  /** Border + title + highlighted-row tint. */
  color: string
  rows: AnalyticStatRow[]
}

/** 4-row stat card used on the วิเคราะห์ปริมาณจราจร tab. Border + title
 *  pick up the per-card accent color; one row per card (the `highlight: true`
 *  row) renders its value in the same accent. */
const AnalyticStatCard: React.FC<AnalyticStatCardProps> = ({
  icon,
  title,
  color,
  rows,
}) => (
  <div
    className='py-4 px-5 rounded-[14px] flex flex-col h-full'
    style={{
      background: '#191919',
    }}
  >
    <div className='flex items-center gap-2.5 mb-4'>
      <span
        className='flex items-center justify-center rounded-full shrink-0'
        style={{
          width: 32,
          height: 32,
          background: `${color}26`,
          color,
        }}
      >
        {icon}
      </span>
      <span
        className='fs-16 font-medium'
        style={{ color, fontWeight: 600 }}
      >
        {title}
      </span>
    </div>
    <div className='flex flex-col gap-2.5'>
      {rows.map((row, i) => (
        <div
          key={i}
          className='flex items-center justify-between gap-3'
        >
          <span className='fs-13 text-white/60'>{row.label} :</span>
          <span
            className='fs-14 font-semibold tabular-nums whitespace-nowrap'
            style={{ color: row.highlight ? color : '#ffffff' }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)

export default React.memo<AnalyticStatCardProps>(AnalyticStatCard)
