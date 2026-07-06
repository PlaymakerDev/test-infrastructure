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
  /** หน่วยต่อท้ายค่าใน tooltip (เช่น "%", "kg") — override `tooltipUnit` */
  unit?: string
  /** วาดเส้นเป็นเส้นประ (default `false`) */
  dashed?: boolean
  /** ซ่อนเส้นนี้จาก tooltip rows (เส้นยังคงวาดบนกราฟ) */
  hideInTooltip?: boolean
}

/** Extra row shown in tooltip but NOT rendered as a visible line. Useful when
 *  you want the chart to focus on one series visually but expose related
 *  metrics on hover (e.g. ET Rate line + time saved + CO2 reduction). */
export interface TooltipExtra {
  /** Field key in `data` to read from */
  dataKey: string
  /** Label shown on the left of the row */
  label: string
  /** Color for the row label/dot */
  color: string
  /** Optional unit suffix shown after value (e.g. "m", "kg") */
  unit?: string
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
  /** class ของ card ด้านนอก (แทนที่ default ทั้งหมดถ้าส่งมา) — default: 'relative rounded-2xl pt-5 px-5 pb-4 w-full h-full overflow-hidden' */
  className?: string
  /** ชื่อหัวข้อ */
  title?: string
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
  /** Extra padding (px) below the auto-contained x-axis labels. Default 28 —
   *  lower it (e.g. 8) to pull the plot down when the card has spare space. */
  gridBottom?: number
  /** Padding (px) above the plot. Default 16 — lower it to pull the plot up
   *  closer to the card title. */
  gridTop?: number
  /** กำหนด ticks บน Y-axis */
  yAxisTicks?: number[]
  /** domain ของ Y-axis */
  yAxisDomain?: [number | 'auto', number | 'auto']
  /** หมุน label แกน X (องศา) — default 0 (ไม่หมุน). ใช้กับ label ยาว/หนาแน่น */
  xAxisLabelRotate?: number
  /** จำกัดความกว้าง label แกน X (px) แล้วตัดด้วย … (ข้อความเต็มโชว์ใน tooltip) — default ไม่จำกัด */
  xAxisLabelMaxWidth?: number

  // ── Theme overrides (optional — defaults preserve original look) ──────────
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
  /** อ่านวันที่ต่อจุดจาก field นี้ใน data point (ใช้กับ multi-day data ที่
   *  แต่ละจุดมีวันที่ต่างกัน). ถ้าทั้ง `tooltipDate` และ `tooltipDateKey`
   *  ถูกตั้ง — `tooltipDateKey` (per-point) ชนะ. */
  tooltipDateKey?: string
  /** ข้อความต่อท้ายบรรทัดที่ 2 ของ header tooltip (axisValue) — default ' น.'
   *  (เหมาะกราฟรายชั่วโมง). ตั้ง '' สำหรับแกนที่เป็นชื่อวัน/หมวด */
  tooltipDateSuffix?: string
  /** หน่วยต่อท้ายค่าใน tooltip (เช่น "V", "A") — ใช้เป็น default ถ้า LineConfig.unit ว่าง */
  tooltipUnit?: string
  /** แสดงจุดสี (●) นำหน้า label ของแต่ละเส้นใน tooltip (default `false`) */
  tooltipShowDot?: boolean
  /** Extra rows shown in tooltip but NOT rendered as visible lines.
   *  Reads values from each data point via `dataKey`. */
  tooltipExtras?: TooltipExtra[]
  /** HTML ที่ต่อท้าย tooltip rows + extras — รับ `dataIndex` ของจุดที่ hover */
  tooltipFooter?: (dataIndex: number) => string
}

interface TooltipParam {
  color: string
  value: number
  seriesName: string
  seriesIndex: number
  axisValue: string
  dataIndex: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const LineChart: React.FC<LineChartProps> = ({
  className = 'relative rounded-2xl pt-5 px-5 pb-4 w-full h-full overflow-hidden',
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
  gridBottom = 28,
  gridTop = 16,
  yAxisTicks,
  yAxisDomain = [0, 'auto'],
  xAxisLabelRotate = 0,
  xAxisLabelMaxWidth,
  // Theme overrides — defaults match the original look
  accentColor = '#FCD116',
  cardBackground = '#00000080',
  cardBorderColor = '#1f2d3d',
  showGlow = true,
  iconCircle = true,
  // Tooltip extras
  tooltipDate,
  tooltipDateKey,
  tooltipDateSuffix = ' น.',
  tooltipUnit,
  tooltipShowDot = false,
  tooltipExtras,
  tooltipFooter,
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
      grid: { top: gridTop, right: 16, bottom: gridBottom, left: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#ffffff',
          fontSize: 11,
          // Keep the line flush to both edges (boundaryGap:false) while stopping
          // the first/last category labels from overflowing past the card edge:
          // align the first label to the left and the last to the right.
          alignMinLabel: 'left',
          alignMaxLabel: 'right',
          ...(xAxisLabelRotate ? { rotate: xAxisLabelRotate } : {}),
          ...(typeof xAxisLabelMaxWidth === 'number'
            ? { width: xAxisLabelMaxWidth, overflow: 'truncate' }
            : {}),
        },
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
          color: '#ffffff',
          fontSize: 11,
          formatter: (v: number) => v >= 1000 ? `${v / 1000}K` : String(v),
        },
        splitLine: { lineStyle: { color: '#1f2d3d', type: 'solid' } },
      },
      tooltip: {
        trigger: 'axis',
        // Render tooltip in <body> so it escapes the card's `overflow: hidden`
        // (otherwise hover near the card edge gets clipped).
        appendToBody: true,
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
          const dataIdxForHeader = params[0]?.dataIndex
          // Prefer per-point date (`tooltipDateKey`) when provided; fall back
          // to the static `tooltipDate` string.
          const perPointDate =
            tooltipDateKey && dataIdxForHeader !== undefined
              ? data[dataIdxForHeader]?.[tooltipDateKey]
              : undefined
          const headerDate = perPointDate ?? tooltipDate
          const header = headerDate
            ? `<div style="text-align:center;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;">
                 <div style="color:#fff;font-size:13px;font-weight:600;">${headerDate}</div>
                 <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px;">${params[0]?.axisValue ?? ''}${tooltipDateSuffix}</div>
               </div>`
            : // When labels are truncated, surface the full category in the tooltip.
            typeof xAxisLabelMaxWidth === 'number' && params[0]?.axisValue
              ? `<div style="color:#fff;font-weight:600;margin-bottom:6px;max-width:260px;white-space:normal;line-height:1.4">${params[0].axisValue}</div>`
              : ''
          const rows = params
            .map((p) => {
              const cfg = lines[p.seriesIndex]
              if (cfg?.hideInTooltip) return ''
              const color = cfg?.color ?? p.color
              const label = cfg?.label ?? p.seriesName
              const value = Number(p.value).toLocaleString()
              // Per-line unit wins; fall back to global tooltipUnit.
              const rowUnit = cfg?.unit ?? tooltipUnit
              const unit = rowUnit ? ` ${rowUnit}` : ''
              const dot = tooltipShowDot
                ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>`
                : ''
              return `<div style="display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:${header ? 4 : 0}px">
                <span style="color:${color};display:inline-flex;align-items:center;">${dot}${label}</span>
                <span style="color:${tooltipShowDot ? '#fff' : color};font-weight:700">${value}${unit}</span>
              </div>`
            })
            .join('')

          // Extra rows — read by `dataKey` from the original data point.
          const dataIdx = params[0]?.dataIndex
          const extras = (tooltipExtras ?? [])
            .map((extra) => {
              const raw = dataIdx !== undefined ? data[dataIdx]?.[extra.dataKey] : undefined
              if (raw === undefined || raw === null || raw === '') return ''
              const value = typeof raw === 'number' ? raw.toLocaleString() : String(raw)
              const unit = extra.unit ? ` ${extra.unit}` : ''
              const dot = tooltipShowDot
                ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${extra.color};margin-right:6px;"></span>`
                : ''
              return `<div style="display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:4px">
                <span style="color:${extra.color};display:inline-flex;align-items:center;">${dot}${extra.label}</span>
                <span style="color:${tooltipShowDot ? '#fff' : extra.color};font-weight:700">${value}${unit}</span>
              </div>`
            })
            .join('')

          const footer =
            tooltipFooter && dataIdx !== undefined ? tooltipFooter(dataIdx) : ''

          return header + rows + extras + footer
        },
      },
      series: lines.map((line) => ({
        name: line.label,
        type: 'line',
        // Flat reference/dashed guidelines look wrong when smoothed — the
        // smoothing tries to curve a straight horizontal line into a spline
        // and the shadow bleeds between dashes. Keep smoothing for real
        // data lines only.
        smooth: !line.dashed,
        data: data.map((d) => d[line.dataKey] ?? 0),
        lineStyle: {
          color: line.color,
          width: 3,
          // Glow shadow hides the gaps in a dashed line — disable it there.
          shadowBlur: line.dashed ? 0 : 12,
          shadowColor: line.color + '60',
          // Explicit dash pattern is more visible than echarts' default
          // 'dashed' (which draws very short segments).
          type: line.dashed ? [10, 6] : 'solid',
        },
        itemStyle: { color: line.color },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: { showSymbol: true, scale: 1.4 },
        areaStyle: null,
        // Force dashed reference lines above the real data curve so they
        // stay visible even when the curve crosses them.
        z: line.dashed ? 3 : 2,
      })),
    }
  }, [data, lines, yAxisTicks, yAxisDomain, tooltipDate, tooltipDateKey, tooltipDateSuffix, tooltipUnit, tooltipShowDot, tooltipExtras, tooltipFooter, xAxisLabelRotate, xAxisLabelMaxWidth, gridBottom, gridTop])

  return (
    <div
      className={className}
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
            {title && (
              <h2
                className='font-semibold leading-tight'
                style={{ color: accentColor, fontSize: titleSize }}
              >
                {title}
              </h2>
            )}
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
