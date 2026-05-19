"use client"
import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PieChartDataPoint {
  name: string
  value: number
  color: string
}

export interface PieChartProps {
  /** ชื่อหัวข้อ */
  title: string
  /** ขนาด font ของ title (px) */
  titleSize?: number
  /** icon แสดงด้านซ้ายของ title */
  icon?: React.ReactNode
  /** ข้อมูลกราฟ */
  data: PieChartDataPoint[]
  /** ข้อความบน center (บรรทัดบน) */
  centerLabel?: string
  /** หน่วยใต้ตัวเลข center */
  centerUnit?: string
  /** ตัวเลือก tab period — ถ้าไม่ส่งจะไม่แสดง tab */
  periods?: string[]
  /** period ที่ active เริ่มต้น */
  defaultPeriod?: string
  /** callback เมื่อเปลี่ยน period */
  onPeriodChange?: (period: string) => void
  /** ความสูงของ donut chart (default 280) */
  height?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const PieChart: React.FC<PieChartProps> = ({
  title,
  titleSize = 16,
  icon,
  data,
  centerLabel,
  centerUnit,
  periods,
  defaultPeriod,
  onPeriodChange,
  height = 280,
}) => {
  const [activePeriod, setActivePeriod] = useState(defaultPeriod ?? periods?.[0] ?? '')

  const total = data.reduce((sum, d) => sum + d.value, 0)

  const handlePeriod = (p: string) => {
    setActivePeriod(p)
    onPeriodChange?.(p)
  }

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e2533',
      borderColor: '#2e3a4e',
      borderWidth: 1,
      padding: [10, 16],
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params: any) =>
        `<div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${params.data.itemStyle.color}"></span>
          <span>${params.name}</span>
          <span style="font-weight:700;margin-left:8px;color:${params.data.itemStyle.color}">${Number(params.value).toLocaleString()}</span>
        </div>`,
    },
    series: [
      {
        type: 'pie',
        radius: ['62%', '88%'],
        center: ['50%', '50%'],
        startAngle: 90,
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color, borderColor: '#00000080', borderWidth: 2 },
        })),
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' },
        },
      },
    ],
  }), [data])

  return (
    <div
      className='relative rounded-2xl p-5 w-full overflow-hidden'
      style={{ background: '#00000080', border: '1px solid #1f2d3d' }}
    >
      {/* Golden glow top-left */}
      <div
        className='pointer-events-none absolute -top-16 -left-16 w-96 h-72'
        style={{ background: 'radial-gradient(ellipse at top left, rgba(234,179,8,0.25) 0%, transparent 70%)' }}
      />
      {/* Golden glow top-right */}
      <div
        className='pointer-events-none absolute -top-16 -right-16 w-96 h-72'
        style={{ background: 'radial-gradient(ellipse at top right, rgba(234,179,8,0.2) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className='relative flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          {icon && (
            <div
              className='flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0'
              style={{ background: 'rgba(234,179,8,0.15)' }}
            >
              {icon}
            </div>
          )}
          <h2 className='font-semibold' style={{ color: '#FCD116', fontSize: titleSize }}>
            {title}
          </h2>
        </div>

        {/* Period tabs */}
        {periods && periods.length > 0 && (
          <div
            className='flex gap-1 rounded-full p-1 text-sm'
            style={{ background: '#3a2e00' }}
          >
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className='px-4 py-1 rounded-full transition-colors cursor-pointer'
                style={
                  activePeriod === p
                    ? { background: '#0d0d0d', color: '#eab308', fontWeight: 600 }
                    : { color: '#c9b97a' }
                }
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className='relative flex items-center gap-8 flex-wrap'>

        {/* Donut chart + center text */}
        <div className='relative flex-shrink-0' style={{ width: 260, height }}>
          <ReactECharts
            option={option}
            style={{ width: '100%', height: '100%' }}
            notMerge
            opts={{ renderer: 'svg' }}
          />

          {/* Center text overlay */}
          <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6'>
            {centerLabel && (
              <p className='text-xs leading-snug mb-1' style={{ color: '#8a9ab5' }}>
                {centerLabel}
              </p>
            )}
            <p className='text-3xl font-bold text-white leading-none'>
              {total.toLocaleString()}
            </p>
            {centerUnit && (
              <p className='text-sm mt-1' style={{ color: '#8a9ab5' }}>{centerUnit}</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className='flex-1 min-w-0 flex flex-col gap-3'>
          {data.map((entry, i) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0'
            return (
              <div key={i} className='flex items-center gap-3'>
                <span
                  className='w-3 h-3 rounded-full flex-shrink-0'
                  style={{ background: entry.color }}
                />
                <span className='flex-1 text-sm text-white truncate'>{entry.name}</span>
                <span className='text-sm tabular-nums' style={{ color: '#8a9ab5' }}>
                  {entry.value.toLocaleString()}
                </span>
                <span className='text-sm font-semibold tabular-nums w-12 text-right text-white'>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default React.memo(PieChart)
