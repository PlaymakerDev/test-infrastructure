"use client"
import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GaugeTableRow {
  time: string
  value: number
  /** overrides component-level unit */
  unit?: string
  /** yellow dot + gold text on this row */
  highlighted?: boolean
}

export interface GaugeChartProps {
  title: string
  icon?: React.ReactNode
  value: number
  unit?: string
  min?: number
  max?: number
  tableTitle?: string
  tableTimeLabel?: string
  tableValueLabel?: string
  tableRows?: GaugeTableRow[]
  /** height of the ECharts canvas (default 260) */
  height?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  icon,
  value,
  unit = '',
  min = 0,
  max = 120,
  tableTitle,
  tableTimeLabel = 'เวลา',
  tableValueLabel = 'ความเร็วเฉลี่ย',
  tableRows = [],
  height = 270,
}) => {
  const option = useMemo(() => {
    const pct = Math.min(Math.max((value - min) / (max - min), 0), 1)

    // Shared geometry for both series layers
    const base = {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min,
      max,
      splitNumber: 12,
      radius: '100%',
      center: ['50%', '62%'],
      pointer: { show: false },
      data: [{ value }],
    }

    return {
      backgroundColor: 'transparent',
      series: [
        {
          // ── Layer 1: thick two-tone track ──────────────────────────────────
          ...base,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [pct, '#E9D682'],
                [1, '#2a2a2a'],
              ],
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
        },
        {
          // ── Layer 2: thin bright ring + ticks + labels + center value ──────
          ...base,
          axisLine: {
            lineStyle: {
              width: 3,
              color: [
                [pct, '#FCD116'],
                [1, 'transparent'],
              ],
            },
          },
          axisTick: {
            show: true,
            splitNumber: 1,
            length: 4,
            distance: -10,
            lineStyle: { color: '#484848', width: 1 },
          },
          splitLine: {
            show: true,
            length: 7,
            distance: -8,
            lineStyle: { color: '#585858', width: 1.5 },
          },
          axisLabel: {
            show: true,
            color: '#7a8899',
            fontSize: 10,
            distance: -18,
          },
          detail: {
            show: true,
            formatter: (val: number) =>
              `{v|${val.toFixed(2)}}${unit ? `\n{u|${unit}}` : ''}`,
            rich: {
              v: {
                fontSize: 38,
                fontWeight: 700,
                color: '#FCD116',
                lineHeight: 46,
              },
              u: {
                fontSize: 14,
                color: '#FCD116',
                lineHeight: 22,
              },
            },
            offsetCenter: [0, '-10%'],
          },
        },
      ],
    }
  }, [value, min, max, unit])

  return (
    <div
      className='relative rounded-2xl p-5 w-full overflow-hidden'
      style={{ background: '#111111', border: '1px solid #FCD116' }}
    >
      {/* ── Header ── */}
      <div className='flex items-center gap-3 mb-1'>
        {icon && (
          <div
            className='flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0'
            style={{ background: 'rgba(252,209,22,0.15)' }}
          >
            {icon}
          </div>
        )}
        <h2 className='text-base' style={{ color: '#FCD116' }}>
          {title}
        </h2>
      </div>

      {/* ── Body ── */}
      <div className='flex items-start gap-4'>

        {/* Gauge canvas */}
        <div className='flex-shrink-0' style={{ width: '52%' }}>
          <ReactECharts
            option={option}
            style={{ height }}
            notMerge
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* Hourly table */}
        <div className='flex-1 pt-1 min-w-0'>
          {tableTitle && (
            <p className='text-sm mb-3' style={{ color: '#FCD116' }}>
              {tableTitle}
            </p>
          )}

          {/* Column headers */}
          <div
            className='flex justify-between text-xs mb-1.5 px-1'
            style={{ color: '#6b7280' }}
          >
            <span>{tableTimeLabel}</span>
            <span>{tableValueLabel}</span>
          </div>

          {/* Divider */}
          <div
            className='mb-1'
            style={{ borderBottom: '1px dashed rgba(252,209,22,0.45)' }}
          />

          {/* Rows */}
          <div className='flex flex-col'>
            {tableRows.map((row, i) => (
              <div
                key={i}
                className='flex items-center justify-between py-1.5 px-1'
              >
                <div className='flex items-center gap-2'>
                  {/* Dot — invisible on non-highlighted rows but preserves alignment */}
                  <span
                    className='w-2 h-2 rounded-full flex-shrink-0'
                    style={{
                      background: '#FCD116',
                      opacity: row.highlighted ? 1 : 0,
                    }}
                  />
                  <span
                    className='text-sm'
                    style={{ color: row.highlighted ? '#FCD116' : '#d1d5db' }}
                  >
                    {row.time}
                  </span>
                </div>
                <span
                  className='text-sm tabular-nums'
                  style={{ color: row.highlighted ? '#FCD116' : '#8a9ab5' }}
                >
                  {row.value.toFixed(2)} {row.unit ?? unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(GaugeChart)
