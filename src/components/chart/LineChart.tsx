"use client"
import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LineConfig {
  /** key ที่ตรงกับ field ใน data */
  dataKey: string
  /** สีของเส้น */
  color: string
  /** ชื่อที่แสดงใน tooltip */
  label: string
}

export interface LineChartDataPoint {
  /** ชื่อบน X-axis */
  label: string
  [key: string]: string | number
}

export interface LineChartStat {
  /** ตัวเลขสรุปแสดงด้านบน */
  value: number | string
  /** คำอธิบายใต้ตัวเลข */
  label: string
  /** สีจุดและ label */
  color: string
}

export interface LineChartProps {
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
  data: LineChartDataPoint[]
  /** กำหนดเส้นแต่ละชุด */
  lines: LineConfig[]
  /** สรุปตัวเลขแสดงเหนือกราฟ */
  stats?: LineChartStat[]
  /** ตัวเลือก tab period — ถ้าไม่ส่งจะไม่แสดง tab */
  periods?: string[]
  /** period ที่ active เริ่มต้น */
  defaultPeriod?: string
  /** callback เมื่อเปลี่ยน period */
  onPeriodChange?: (period: string) => void
  /** ความสูง chart (default 260) */
  height?: number
  /** กำหนด ticks บน Y-axis */
  yAxisTicks?: number[]
  /** domain ของ Y-axis */
  yAxisDomain?: [number | 'auto', number | 'auto']

  // ── Theme overrides (optional — defaults preserve original look) ──────────
  /** ขนาด title (pixel). ถ้าไม่ระบุ ใช้ globals.css h2 clamp */
  titleSize?: number
  /** สี title + icon accent (default `#FCD116`) */
  accentColor?: string
  /** สีพื้นหลังการ์ด (default `#00000080`) */
  cardBackground?: string
  /** สีขอบการ์ด (default `#1f2d3d`) */
  cardBorderColor?: string
  /** แสดง golden glow ที่มุมบน 2 มุม (default `true`) */
  showGlow?: boolean
  /** ห่อ icon ในวงกลม yellow tint (default `true`) ตั้ง false เพื่อแสดง icon ตรงๆ */
  iconCircle?: boolean

  // ── Tooltip extras ────────────────────────────────────────────────────────
  /** วันที่แสดงตรงบนสุดของ tooltip (เช่น "20 เม.ย. 2569"). ถ้าไม่ส่งจะไม่แสดง */
  tooltipDate?: string
  /** หน่วยต่อท้ายค่าใน tooltip (เช่น "V", "A") */
  tooltipUnit?: string
  /** แสดงจุดสี (●) นำหน้า label ของแต่ละเส้นใน tooltip (default `false`) */
  tooltipShowDot?: boolean
}

interface TooltipParam {
  color: string
  value: number
  seriesName: string
  seriesIndex: number
  axisValue: string
}

// ── Component ─────────────────────────────────────────────────────────────────

const LineChart: React.FC<LineChartProps> = ({
  title,
  titleSize = 16,
  subtitle,
  subtitleSize = 12,
  icon,
  data,
  lines,
  stats,
  periods,
  defaultPeriod,
  onPeriodChange,
  height = 260,
  yAxisTicks,
  yAxisDomain = [0, 'auto'],
  // Theme overrides — defaults match the original look
  titleSize,
  accentColor = '#FCD116',
  cardBackground = '#00000080',
  cardBorderColor = '#1f2d3d',
  showGlow = true,
  iconCircle = true,
  // Tooltip extras
  tooltipDate,
  tooltipUnit,
  tooltipShowDot = false,
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
      grid: { top: 16, right: 16, bottom: 40, left: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8a9ab5', fontSize: 11 },
        splitLine: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        ...(yInterval ? { interval: yInterval } : {}),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#8a9ab5',
          fontSize: 11,
          formatter: (v: number) => v >= 1000 ? `${v / 1000}K` : String(v),
        },
        splitLine: { lineStyle: { color: '#1f2d3d', type: 'solid' } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e2533',
        borderColor: '#2e3a4e',
        borderWidth: 1,
        padding: [10, 16],
        textStyle: { color: '#ffffff', fontSize: 12 },
        axisPointer: {
          type: 'line',
          lineStyle: { color: 'rgba(255,255,255,0.15)', width: 1, type: 'solid' },
        },
        // When `tooltipDate` is provided, prepend a centered "date / x-axis-label"
        // header to each tooltip. When `tooltipShowDot` is true, lead each line
        // with a colored "●" matching the series color. When `tooltipUnit` is
        // provided, append it after each value.
        formatter: (params: TooltipParam[]) => {
          const header = tooltipDate
            ? `<div style="text-align:center;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;">
                 <div style="color:#fff;font-size:13px;font-weight:600;">${tooltipDate}</div>
                 <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px;">${params[0]?.axisValue ?? ''} น.</div>
               </div>`
            : ''
          const rows = params
            .map((p) => {
              const cfg = lines[p.seriesIndex]
              const color = cfg?.color ?? p.color
              const label = cfg?.label ?? p.seriesName
              const value = Number(p.value).toLocaleString()
              const unit = tooltipUnit ? ` ${tooltipUnit}` : ''
              const dot = tooltipShowDot
                ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>`
                : ''
              return `<div style="display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:${header ? 4 : 0}px">
                <span style="color:${color};display:inline-flex;align-items:center;">${dot}${label}</span>
                <span style="color:${tooltipShowDot ? '#fff' : color};font-weight:700">${value}${unit}</span>
              </div>`
            })
            .join('')
          return header + rows
        },
      },
      series: lines.map((line) => ({
        name: line.label,
        type: 'line',
        smooth: true,
        data: data.map((d) => d[line.dataKey] ?? 0),
        lineStyle: {
          color: line.color,
          width: 3,
          shadowBlur: 12,
          shadowColor: line.color + '60',
        },
        itemStyle: { color: line.color },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: { showSymbol: true, scale: 1.4 },
        areaStyle: null,
      })),
    }
  }, [data, lines, yAxisTicks, yAxisDomain, tooltipDate, tooltipUnit, tooltipShowDot])

  return (
    <div
      className='relative rounded-2xl p-5 w-full overflow-hidden'
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
            <h2 className='font-semibold leading-tight' style={{ color: '#FCD116', fontSize: titleSize }}>
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

      {/* Stats summary */}
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
    </div>
  )
}

export default React.memo(LineChart)
