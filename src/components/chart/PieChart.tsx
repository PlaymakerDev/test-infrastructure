"use client"
import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PieChartDataPoint {
  name: string
  value: number
  color: string
}

/** One outer label entry — render order matches `data[]` (per-segment).
 *  Position is computed from each segment's midpoint angle. */
export interface PieChartOuterLabel {
  /** Top line (e.g. phase name "P1") */
  title: string
  /** Bottom line below the dot (e.g. "60s") */
  subtitle?: string
  /** Color for title. Falls back to the segment's color. */
  titleColor?: string
  /** Color for the dot before subtitle. Falls back to titleColor / segment color. */
  dotColor?: string
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
  /** หน่วยต่อท้ายค่าใน tooltip (เช่น "s") — default ไม่มี */
  tooltipUnit?: string
  /** ตัวเลือก tab period — ถ้าไม่ส่งจะไม่แสดง tab */
  periods?: string[]
  /** period ที่ active เริ่มต้น */
  defaultPeriod?: string
  /** callback เมื่อเปลี่ยน period */
  onPeriodChange?: (period: string) => void
  /** ความสูงของ donut chart (default 280) */
  height?: number

  // ── Theme overrides (optional — defaults preserve original look) ──────────
  /** Card background (default `#00000080`) */
  cardBackground?: string
  /** Card border color (default `#1f2d3d`) */
  cardBorderColor?: string
  /** แสดง golden glow ที่มุมบน 2 มุม (default `true`) */
  showGlow?: boolean
  /** ห่อ icon ในวงกลม yellow tint (default `true`) */
  iconCircle?: boolean
  /** สี title (default `#FCD116`) */
  titleColor?: string

  // ── Donut config ──────────────────────────────────────────────────────────
  /** Sweep direction (default `true` = clockwise) */
  clockwise?: boolean
  /** มุมเริ่มต้นเป็นองศา (default 90 = 12 นาฬิกา) */
  startAngle?: number
  /** Donut เป็นสี่เหลี่ยมจัตุรัส (px). ถ้าไม่ส่งใช้ 260 × height */
  donutSize?: number
  /** Inner/outer radius เป็น % (default `['62%', '88%']`) */
  radius?: [string, string]
  /** สีเส้นแบ่ง segment ของ donut (default `#00000080`) */
  segmentBorderColor?: string
  /** ความหนาเส้นแบ่ง segment (px). ส่ง `0` เพื่อปิดเส้นแบ่ง (default 2) */
  segmentBorderWidth?: number

  // ── Center text customization ─────────────────────────────────────────────
  /** Override center number (default = sum of data values) */
  centerValue?: string | number
  /** สี center value (default `#fff`) */
  centerValueColor?: string
  /** ขนาด font ของ center value (default 30) */
  centerValueSize?: number
  /** สี centerLabel (top) (default `#8a9ab5`) */
  centerLabelColor?: string
  /** สี centerUnit (bottom) (default `#8a9ab5`) */
  centerUnitColor?: string
  /** ขนาด font ของ centerLabel (default 12) */
  centerLabelSize?: number
  /** ขนาด font ของ centerUnit (default 14) */
  centerUnitSize?: number

  // ── Legend / outer labels ─────────────────────────────────────────────────
  /** Show right-side legend list (default `true` when no `outerLabels`, else `false`) */
  showLegend?: boolean
  /** Outer labels positioned around the donut by segment midpoint. */
  outerLabels?: PieChartOuterLabel[]
  /** Radius (px from donut center) for outer labels. Default `donutSize/2 + 20`. */
  outerLabelRadius?: number
  /** Font size (px) of the outer-label subtitle (e.g. "15s"). Default 11. */
  outerLabelSubtitleSize?: number
  /** Cap legend height (px) and enable internal scroll — keeps the card compact
   *  when there are many entries (e.g. 10+ event types on one road). */
  legendMaxHeight?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const PieChart: React.FC<PieChartProps> = ({
  title,
  titleSize = 16,
  icon,
  data,
  centerLabel,
  centerUnit,
  tooltipUnit = '',
  periods,
  defaultPeriod,
  onPeriodChange,
  height = 280,

  // theme
  cardBackground = '#00000080',
  cardBorderColor = '#1f2d3d',
  showGlow = true,
  iconCircle = true,
  titleColor = '#FCD116',

  // donut
  clockwise = true,
  startAngle = 90,
  donutSize,
  radius = ['62%', '88%'],
  segmentBorderColor = '#00000080',
  segmentBorderWidth = 2,

  // center
  centerValue,
  centerValueColor = '#ffffff',
  centerValueSize = 30,
  centerLabelColor = '#8a9ab5',
  centerUnitColor = '#8a9ab5',
  centerLabelSize = "var(--fs-12)",
  centerUnitSize = 14,

  // layout
  showLegend,
  outerLabels,
  outerLabelRadius,
  outerLabelSubtitleSize = 11,
  legendMaxHeight,
}) => {
  const [activePeriod, setActivePeriod] = useState(defaultPeriod ?? periods?.[0] ?? '')

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const shouldShowLegend = showLegend ?? !outerLabels
  const containerWidth = donutSize ?? 260
  const containerHeight = donutSize ?? height
  const labelRadius = outerLabelRadius ?? containerWidth / 2 + 20

  const handlePeriod = (p: string) => {
    setActivePeriod(p)
    onPeriodChange?.(p)
  }

  // ── Outer label positions — computed from each segment's midpoint angle.
  // ECharts default direction is clockwise. With math angles measured
  // counter-clockwise from positive x-axis, "clockwise" means decreasing angle.
  const labelPositions = useMemo(() => {
    if (!outerLabels || outerLabels.length === 0) return []
    const direction = clockwise ? -1 : 1
    let acc = startAngle
    return data.map((d, i) => {
      const span = total > 0 ? (d.value / total) * 360 : 0
      const mid = acc + (direction * span) / 2
      acc += direction * span
      const rad = (mid * Math.PI) / 180
      return {
        x: Math.cos(rad),
        y: -Math.sin(rad), // CSS y is flipped vs math
        label: outerLabels[i],
        segmentColor: d.color,
      }
    })
  }, [data, outerLabels, total, startAngle, clockwise])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      // Render tooltip in <body> so it escapes the card's `overflow: hidden`
      // (otherwise hover near the card edge gets clipped).
      appendToBody: true,
      // Body-mounted tooltips escape the .mapboxgl/app containers — the
      // 'echarts-tooltip' class lets custom.css force IBM Plex Sans Thai
      // over ECharts' inline sans-serif default.
      className: 'echarts-tooltip',
      backgroundColor: '#1e2533',
      borderColor: '#2e3a4e',
      borderWidth: 1,
      padding: [10, 16],
      textStyle: { color: '#ffffff', fontSize: "var(--fs-12)" },
      formatter: (params: { name: string; value: number; data: { itemStyle: { color: string } } }) =>
        `<div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${params.data.itemStyle.color}"></span>
          <span>${params.name}</span>
          <span style="font-weight:700;margin-left:8px;color:${params.data.itemStyle.color}">${Number(params.value).toLocaleString()}${tooltipUnit ? ` ${tooltipUnit}` : ''}</span>
        </div>`,
    },
    series: [
      {
        type: 'pie',
        radius,
        center: ['50%', '50%'],
        startAngle,
        clockwise,
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: {
            color: d.color,
            borderColor: segmentBorderColor,
            borderWidth: segmentBorderWidth,
          },
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
  }), [data, radius, startAngle, clockwise, segmentBorderColor, segmentBorderWidth, tooltipUnit])

  return (
    <div
      className='relative rounded-2xl p-5 w-full h-full overflow-hidden'
      style={{ background: cardBackground, border: `1px solid ${cardBorderColor}` }}
    >
      {/* Golden glow — optional */}
      {showGlow && (
        <>
          <div
            className='pointer-events-none absolute -top-16 -left-16 w-96 h-72'
            style={{ background: 'radial-gradient(ellipse at top left, rgba(234,179,8,0.25) 0%, transparent 70%)' }}
          />
          <div
            className='pointer-events-none absolute -top-16 -right-16 w-96 h-72'
            style={{ background: 'radial-gradient(ellipse at top right, rgba(234,179,8,0.2) 0%, transparent 70%)' }}
          />
        </>
      )}

      {/* Header */}
      <div className='relative flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          {icon && (
            iconCircle ? (
              <div
                className='flex items-center justify-center w-9 h-9 rounded-full shrink-0'
                style={{ background: 'rgba(234,179,8,0.15)', color: titleColor }}
              >
                {icon}
              </div>
            ) : (
              <span className='flex items-center shrink-0' style={{ color: titleColor }}>
                {icon}
              </span>
            )
          )}
          <h2 style={{ color: titleColor, fontSize: titleSize, fontWeight: 400 }}>
            {title}
          </h2>
        </div>

        {/* Period tabs */}
        {periods && periods.length > 0 && (
          <div
            className='flex gap-1 rounded-full p-1 fs-12'
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
      <div
        className={`relative flex items-center gap-8 flex-wrap ${shouldShowLegend ? '' : 'justify-center'}`}
      >
        {/* Donut chart + center text + optional outer labels */}
        <div
          className='relative shrink-0'
          style={{ width: containerWidth, height: containerHeight }}
        >
          <ReactECharts
            option={option}
            style={{ width: '100%', height: '100%' }}
            notMerge
            opts={{ renderer: 'svg' }}
          />

          {/* Center text overlay */}
          <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4'>
            {centerLabel && (
              <p
                className='leading-snug mb-1'
                style={{ color: centerLabelColor, fontSize: centerLabelSize }}
              >
                {centerLabel}
              </p>
            )}
            <p
              className='font-bold leading-none'
              style={{ color: centerValueColor, fontSize: centerValueSize }}
            >
              {centerValue !== undefined
                ? centerValue
                : total.toLocaleString()}
            </p>
            {centerUnit && (
              <p className='mt-1' style={{ color: centerUnitColor, fontSize: centerUnitSize }}>
                {centerUnit}
              </p>
            )}
          </div>

          {/* Outer labels — positioned around the donut */}
          {outerLabels && (
            <div className='absolute inset-0 pointer-events-none'>
              {labelPositions.map((lp, i) => {
                if (!lp.label) return null
                const titleClr = lp.label.titleColor ?? lp.segmentColor
                const dotClr = lp.label.dotColor ?? titleClr
                return (
                  <div
                    key={i}
                    className='absolute flex flex-col items-start'
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(${lp.x * labelRadius}px, ${lp.y * labelRadius}px) translate(-50%, -50%)`,
                      minWidth: 40,
                    }}
                  >
                    <span
                      className='font-bold leading-none'
                      style={{ color: titleClr, fontSize: 18 }}
                    >
                      {lp.label.title}
                    </span>
                    {lp.label.subtitle && (
                      <span
                        className='flex items-center gap-1 text-white mt-1'
                        style={{ fontSize: outerLabelSubtitleSize }}
                      >
                        <span
                          className='inline-block rounded-full'
                          style={{ width: 5, height: 5, background: dotClr }}
                        />
                        {lp.label.subtitle}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend (right side) */}
        {shouldShowLegend && (
          <div
            // `no-scrollbar` keeps the legend clean even when many event types
            // make it overflow — users can still mouse-wheel/touch through it.
            // `pr-2` gives the right-edge "%" digits some breathing room so
            // they don't get clipped against the card border.
            className={`flex-1 min-w-0 flex flex-col gap-3 pr-2 ${legendMaxHeight ? 'no-scrollbar' : ''}`}
            style={
              legendMaxHeight
                ? { maxHeight: legendMaxHeight, overflowY: 'auto' }
                : undefined
            }
          >
            {data.map((entry, i) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0'
              return (
                <div key={i} className='flex items-center gap-3'>
                  <span
                    className='w-3 h-3 rounded-full shrink-0'
                    style={{ background: entry.color }}
                  />
                  <span className='flex-1 fs-12 text-white truncate'>{entry.name}</span>
                  <span className='fs-12 tabular-nums' style={{ color: '#8a9ab5' }}>
                    {entry.value.toLocaleString()}
                  </span>
                  <span className='fs-12 font-semibold tabular-nums w-12 text-right text-white'>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(PieChart)
