"use client"
import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BarConfig {
  /** key ที่ตรงกับ field ใน data */
  dataKey: string
  /** สีของ bar */
  color: string
  /** ชื่อที่แสดงใน tooltip */
  label: string
}

export interface BarChartDataPoint {
  /** ชื่อบน X-axis รองรับ 2 บรรทัด โดยใช้ \n เช่น "จ.\n27/03" */
  label: string
  [key: string]: string | number
}

export interface BarChartStat {
  /** ตัวเลขสรุปแสดงด้านบนกราฟ */
  value: number | string
  /** คำอธิบายใต้ตัวเลข */
  label: string
  /** สีจุดและ label */
  color: string
}

export interface BarChartProps {
  /** ชื่อหัวข้อ */
  title: string
  /** ขนาด font ของ title (px) */
  titleSize?: number
  /** คำอธิบายใต้ title */
  subtitle?: string
  /** ขนาด font ของ subtitle (px) */
  subtitleSize?: number
  /** icon แสดงด้านซ้ายของ title */
  icon?: React.ReactNode
  /** ข้อมูลกราฟ */
  data: BarChartDataPoint[]
  /** กำหนด bar แต่ละชุด */
  bars: BarConfig[]
  /** สรุปตัวเลขแสดงเหนือกราฟ */
  stats?: BarChartStat[]
  /** ตัวเลือก tab period — ถ้าไม่ส่งจะไม่แสดง tab */
  periods?: string[]
  /** period ที่ active เริ่มต้น */
  defaultPeriod?: string
  /** callback เมื่อเปลี่ยน period */
  onPeriodChange?: (period: string) => void
  /** ความสูง chart (default 280) */
  height?: number
  /** กำหนด ticks บน Y-axis */
  yAxisTicks?: number[]
  /** domain ของ Y-axis */
  yAxisDomain?: [number | 'auto', number | 'auto']

  // ── Theme overrides (optional — defaults preserve original look) ──────────
  /** สี title + icon accent (default `#FCD116`) */
  accentColor?: string
  /** สีพื้นหลังการ์ด (default `#00000080`) */
  cardBackground?: string
  /** สีขอบการ์ด (default `#1f2d3d`) */
  cardBorderColor?: string
  /** แสดง golden glow ที่มุมบน 2 มุม (default `false`) */
  showGlow?: boolean
  /** ห่อ icon ในวงกลม yellow tint (default `true`) */
  iconCircle?: boolean
  /** รูปแบบการแสดงผล bar: solid = สีทึบ, gradient = ไล่สีจากบนลงล่าง (default `'solid'`) */
  barFill?: 'solid' | 'gradient'
  /** Optional content rendered inside the card, below the chart. Useful for
   *  putting an average/summary footer inside the same border as the chart. */
  footer?: React.ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────────

const BarChart: React.FC<BarChartProps> = ({
  title,
  titleSize = 16,
  subtitle,
  subtitleSize = 12,
  icon,
  data,
  bars,
  stats,
  periods,
  defaultPeriod,
  onPeriodChange,
  height = 280,
  yAxisTicks,
  yAxisDomain = [0, 'auto'],
  accentColor = '#FCD116',
  cardBackground = '#00000080',
  cardBorderColor = '#1f2d3d',
  showGlow = false,
  iconCircle = true,
  barFill = 'solid',
  footer,
}) => {
  const [activePeriod, setActivePeriod] = useState(defaultPeriod ?? periods?.[0] ?? '')

  const handlePeriod = (p: string) => {
    setActivePeriod(p)
    onPeriodChange?.(p)
  }

  const option = useMemo(() => {
    const yMin = yAxisTicks ? yAxisTicks[0] : yAxisDomain[0] === 'auto' ? undefined : yAxisDomain[0]
    const yMax = yAxisTicks ? yAxisTicks[yAxisTicks.length - 1] : yAxisDomain[1] === 'auto' ? undefined : yAxisDomain[1]
    const yInterval = yAxisTicks && yAxisTicks.length >= 2 ? yAxisTicks[1] - yAxisTicks[0] : undefined

    return {
      backgroundColor: 'transparent',
      grid: { top: 16, right: 8, bottom: 44, left: 40, containLabel: false },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#8a9ab5',
          fontSize: 11,
          lineHeight: 16,
          interval: 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        ...(yInterval ? { interval: yInterval } : {}),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8a9ab5', fontSize: 12 },
        splitLine: { lineStyle: { color: '#1f2d3d', type: 'solid' } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e2533',
        borderColor: '#2e3a4e',
        borderWidth: 1,
        padding: [10, 16],
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: { seriesIndex: number; value: number; seriesName: string }[]) =>
          params
            .map((p) => {
              const cfg = bars[p.seriesIndex]
              return `<div style="display:flex;justify-content:space-between;gap:24px">
                <span style="color:${cfg?.color}">${cfg?.label ?? p.seriesName}</span>
                <span style="color:${cfg?.color};font-weight:700">${Number(p.value).toLocaleString()}</span>
              </div>`
            })
            .join(''),
      },
      series: bars.map((bar) => ({
        name: bar.label,
        type: 'bar',
        data: data.map((d) => d[bar.dataKey] ?? 0),
        itemStyle: {
          color: barFill === 'gradient'
            ? {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: bar.color },
                { offset: 1, color: `${bar.color}22` },
              ],
            }
            : bar.color,
          borderRadius: [3, 3, 0, 0],
        },
        barMaxWidth: 32,
        barGap: '20%',
      })),
    }
  }, [data, bars, yAxisTicks, yAxisDomain, barFill])

  return (
    <div
      className='relative rounded-2xl pt-5 px-5 pb-1 w-full overflow-hidden'
      style={{ background: cardBackground, border: `1px solid ${cardBorderColor}` }}
    >
      {showGlow && (
        <>
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
        </>
      )}

      {/* Header */}
      <div className='relative flex items-start justify-between mb-4 flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          {icon && (
            iconCircle ? (
              <div
                className='flex items-center justify-center w-9 h-9 rounded-full shrink-0'
                style={{ background: 'rgba(234,179,8,0.15)', color: accentColor }}
              >
                {icon}
              </div>
            ) : (
              <div className='shrink-0' style={{ color: accentColor }}>
                {icon}
              </div>
            )
          )}
          <div>
            <h2 className='font-semibold leading-tight' style={{ color: accentColor, fontSize: titleSize }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ color: '#8a9ab5', fontSize: subtitleSize }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Period tabs */}
        {periods && periods.length > 0 && (
          <div
            className='flex gap-1 rounded-full p-1 text-sm'
            style={{ background: '#A2A2A233' }}
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

      {/* Stats summary — same layout as LineChart for visual consistency */}
      {stats && stats.length > 0 && (
        <div className='relative flex gap-8 mb-4 flex-wrap'>
          {stats.map((stat, i) => (
            <div key={i} className='flex items-start gap-2'>
              <span
                className='w-3 h-3 rounded-full mt-1.5 shrink-0'
                style={{ background: stat.color }}
              />
              <div>
                <p className='text-2xl font-bold text-white leading-tight'>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className='text-xs mt-0.5' style={{ color: stat.color }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ECharts */}
      <div className='relative'>
        <ReactECharts
          option={option}
          style={{ height }}
          notMerge
          opts={{ renderer: 'svg' }}
        />
      </div>

      {/* Optional footer — renders inside the same card border as the chart.
        * `mb-3` adds breathing room below the footer so it doesn't hug the
        * card's bottom edge. */}
      {footer && <div className='relative mt-3 mb-3'>{footer}</div>}
    </div>
  )
}

export default React.memo(BarChart)
