"use client"
import React, { useEffect, useMemo, useRef } from 'react'
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
  /** ขนาด font ของ title (px) */
  titleSize?: number
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
  /** ห่อ icon ในวงกลม yellow tint (default `true`) ตั้ง false เพื่อแสดง icon ตรงๆ */
  iconCircle?: boolean

}

// ── Component ─────────────────────────────────────────────────────────────────

const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  titleSize = 16,
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
  iconCircle = true,
}) => {
  const rowsContainerRef = useRef<HTMLDivElement>(null)
  const highlightedRowRef = useRef<HTMLDivElement>(null)

  // Scroll the highlighted row (e.g. the current hour) into view within the
  // scrollable list on mount / whenever the rows change, instead of always
  // starting scrolled to the top. Leaves one row's height of margin above it
  // (rather than centering) so the previous row still peeks in at the top —
  // clamped to 0 when the highlighted row is near the very start of the list.
  useEffect(() => {
    const container = rowsContainerRef.current
    const row = highlightedRowRef.current
    if (!container || !row) return
    // row.offsetTop is relative to the nearest POSITIONED ancestor (the
    // card's outer `relative` wrapper), not this container — the container
    // itself has no `position` of its own. Subtract container.offsetTop
    // (same ancestor) to get the row's position relative to the container,
    // otherwise scrollTop ends up inflated by everything above the rows
    // list (title/header/divider) and scrolls well past the highlighted row.
    const offsetWithinContainer = row.offsetTop - container.offsetTop
    container.scrollTop = Math.max(0, offsetWithinContainer - row.clientHeight)
  }, [tableRows])

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
                fontSize: "var(--fs-12)",
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
      className='relative rounded-2xl p-5 w-full h-full overflow-hidden'
      style={{ background: '#111111', border: '1px solid #FCD116' }}
    >
      {/* ── Header ── */}
      <div className='flex items-center gap-3 mb-1'>
        {icon && (
          iconCircle ? (
            <div
              className='flex items-center justify-center w-9 h-9 rounded-full shrink-0'
              style={{ background: 'rgba(252,209,22,0.15)' }}
            >
              {icon}
            </div>
          ) : (
            <div className='shrink-0'>
              {icon}
            </div>
          )
        )}
        <h2 className='font-normal!' style={{ color: '#FCD116', fontSize: titleSize }}>
          {title}
        </h2>
      </div>

      {/* ── Body ── */}
      <div className='flex items-start gap-4'>

        {/* Gauge canvas */}
        <div className='shrink-0' style={{ width: '52%' }}>
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
            <p className='fs-12 mb-3' style={{ color: '#FCD116' }}>
              {tableTitle}
            </p>
          )}

          {/* Column headers */}
          <div
            className='flex justify-between fs-12 mb-1.5 px-1'
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
          <div
            ref={rowsContainerRef}
            className={`flex flex-col ${tableRows.length > 6 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}
          >
            {tableRows.map((row, i) => (
              <div
                key={i}
                ref={row.highlighted ? highlightedRowRef : undefined}
                className='flex items-center justify-between py-1.5 px-1'
              >
                <div className='flex items-center gap-2'>
                  {/* Dot — invisible on non-highlighted rows but preserves alignment */}
                  <span
                    className='w-2 h-2 rounded-full shrink-0'
                    style={{
                      background: '#FCD116',
                      opacity: row.highlighted ? 1 : 0,
                    }}
                  />
                  <span
                    className='fs-12'
                    style={{ color: row.highlighted ? '#FCD116' : '#d1d5db' }}
                  >
                    {row.time}
                  </span>
                </div>
                <span
                  className='fs-12 tabular-nums'
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
