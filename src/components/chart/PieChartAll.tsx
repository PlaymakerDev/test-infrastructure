"use client"
import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonutStatusItem {
  /** label shown below the ring */
  label: string
  /** 0–100 */
  value: number
  /** ring color + text color */
  color: string
  /** secondary label inside ring (default "Online") */
  statusLabel?: string
}

export interface PieChartAllProps {
  items: DonutStatusItem[]
  /** ring diameter in px (default 120) */
  size?: number
}

// ── Single donut item ─────────────────────────────────────────────────────────

const DonutItem = React.memo(function DonutItem({
  label,
  value,
  color,
  statusLabel = 'Online',
  size,
}: DonutStatusItem & { size: number }) {
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: ['60%', '84%'],
          startAngle: 90,
          clockwise: true,
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderWidth: 0 },
          data: [
            { value, itemStyle: { color } },
            { value: 100 - value, itemStyle: { color: '#1e1e1e' } },
          ],
        },
      ],
    }),
    [value, color],
  )

  return (
    <div className='flex flex-col items-center'>
      {/* Ring */}
      <div className='relative' style={{ width: size, height: size }}>
        <ReactECharts
          option={option}
          style={{ width: size, height: size }}
          notMerge
          opts={{ renderer: 'svg' }}
        />
        {/* Center text */}
        <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none'>
          <span
            className='font-bold leading-none'
            style={{ color, fontSize: Math.round(size * 0.22) }}
          >
            {value}%
          </span>
          <span
            className='leading-none mt-1'
            style={{ color, fontSize: Math.round(size * 0.13) }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Label below */}
      <span
        className='text-center font-semibold leading-tight mt-2 whitespace-pre-line'
        style={{ color, fontSize: Math.round(size * 0.125), maxWidth: size }}
      >
        {label}
      </span>
    </div>
  )
})

// ── Container ─────────────────────────────────────────────────────────────────

const PieChartAll: React.FC<PieChartAllProps> = ({ items, size = 120 }) => (
  <div className='flex flex-wrap items-start justify-center gap-8'>
    {items.map((item, i) => (
      <DonutItem key={i} {...item} size={size} />
    ))}
  </div>
)

export default React.memo(PieChartAll)
