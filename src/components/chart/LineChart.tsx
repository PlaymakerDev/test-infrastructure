"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  /** ใช้แกน Y ที่สอง (ขวา) แทนแกนหลัก (ซ้าย) — ใช้เมื่อสองเส้นมีหน่วย/สเกล
   *  ต่างกันมาก (เช่น °C กับ μg/m³) การใช้แกนร่วมกันจะทำให้เส้นใดเส้นหนึ่ง
   *  แบนราบจนอ่านไม่ออก (default `0` = แกนหลัก) */
  yAxisIndex?: 0 | 1
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
  [key: string]: string | number | null
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
  subtitle?: string | null
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
  /** period ที่ active เริ่มต้น (ใช้ตอน mount ครั้งแรกเท่านั้น — ถ้าต้องคุมค่าจาก
   *  parent ตลอด อายุ component ให้ใช้ `activePeriod` แทน) */
  defaultPeriod?: string
  /** period ที่ active แบบ controlled — ส่ง state ของฝั่ง parent เข้ามาเพื่อให้
   *  tab ที่เลือกไว้ไม่รีเซ็ตกลับไปที่ `defaultPeriod` เวลา component ตัวนี้ถูก
   *  unmount/remount ระหว่างรอ fetch (เช่น parent สลับไปโชว์ Skeleton ระหว่าง
   *  isLoading แล้วสลับกลับมา — internal state ที่ seed จาก defaultPeriod ตอน
   *  mount จะหายไปพร้อม unmount). ถ้าไม่ส่งจะ fallback ไปใช้ internal state เดิม */
  activePeriod?: string
  /** callback เมื่อเปลี่ยน period */
  onPeriodChange?: (period: string) => void
  /** icon แสดงหน้าชื่อ tab ของแต่ละ period (key ต้องตรงกับค่าใน `periods`) — ไม่ส่งจะไม่แสดง icon */
  periodIcons?: Record<string, React.ReactNode>
  /** ความสูง chart (default 260) */
  height?: number
  /** ให้พื้นที่กราฟยืดเต็ม card แทนความสูงคงที่ (card ต้องมี h-full/height กำหนดจากภายนอก) */
  fillHeight?: boolean
  /** เมื่อใช้ร่วมกับ fillHeight — เอา cap `lg:h-72` (288px) ที่บังคับไว้ default ออก
   *  แล้วให้กราฟยืดเต็ม 100% ของ parent จริงๆ (เหมาะกับ parent ที่จัดสรรพื้นที่สูงกว่า
   *  288px มา เช่น flex-1 chart stack — ไม่งั้นจะเหลือช่องว่างใต้กราฟ) */
  fillHeightUnbounded?: boolean
  /** Extra padding (px) below the auto-contained x-axis labels. Default 28 —
   *  lower it (e.g. 8) to pull the plot down when the card has spare space. */
  gridBottom?: number
  /** Padding (px) above the plot. Default 16 — lower it to pull the plot up
   *  closer to the card title. */
  gridTop?: number
  /** กำหนด ticks บน Y-axis (แกนหลัก/ซ้าย) */
  yAxisTicks?: number[]
  /** domain ของ Y-axis (แกนหลัก/ซ้าย) */
  yAxisDomain?: [number | 'auto', number | 'auto']
  /** ปรับช่วงแกน Y ตามค่าจริง ไม่บังคับให้เริ่มที่ศูนย์. */
  yAxisScale?: boolean
  /** กำหนด ticks บน Y-axis ที่สอง (ขวา) — ใช้ร่วมกับ `LineConfig.yAxisIndex: 1` */
  secondaryYAxisTicks?: number[]
  /** domain ของ Y-axis ที่สอง (ขวา) — ใช้ร่วมกับ `LineConfig.yAxisIndex: 1` */
  secondaryYAxisDomain?: [number | 'auto', number | 'auto']
  /** หมุน label แกน X (องศา) — default 0 (ไม่หมุน). ใช้กับ label ยาว/หนาแน่น */
  xAxisLabelRotate?: number
  /** จำกัดความกว้าง label แกน X (px) แล้วตัดด้วย … (ข้อความเต็มโชว์ใน tooltip) — default ไม่จำกัด */
  xAxisLabelMaxWidth?: number
  /** ระยะห่างของ label แกน X (จำนวน category ที่ข้าม).
   *  - `undefined` (default) = auto — ECharts เลือกเองโดย `hideOverlap` + `showMaxLabel`
   *    (label สุดท้ายถูกบังคับให้โชว์เสมอ อาจทำให้ระยะห่างไม่เท่ากัน)
   *  - `0` = โชว์ทุก label
   *  - `1` = โชว์ทุก label ที่ 2 (เช่น 00, 02, 04, …)
   *  - `N` = โชว์ทุก label ที่ N+1
   *  เมื่อกำหนดค่านี้ระบบจะปิด `showMaxLabel` อัตโนมัติเพื่อให้ระยะห่างเท่ากัน */
  xAxisLabelInterval?: number
  /** แสดงข้อความบนแกน X ทุก N จุด โดยคงทุกจุดข้อมูลไว้บน grid เดียวกัน.
   *  ค่านี้คือ "ระยะห่างที่ต้องการอย่างน้อย" — เมื่อการ์ดแคบจนป้ายชนกัน ระบบจะ
   *  ขยายเป็นตัวคูณถัดไปเอง (เช่น 2 → 4 → 6) เพื่อให้ระยะห่างยังเท่ากันทุกช่วง
   *  ส่วนจุดข้อมูลบนเส้นกราฟยังครบเหมือนเดิม (ซ่อนเฉพาะข้อความ). */
  xAxisLabelEvery?: number
  /** สีของตัวเลข/ข้อความบนแกน X และ Y (default: white). */
  axisLabelColor?: string
  /** เก็บช่องข้อมูลว่างเป็นช่องว่างบนเส้นกราฟ แทนการแทนค่าเป็น 0. */
  preserveNullValues?: boolean
  /** บังคับให้แสดง label สุดท้ายของแกน X แม้กำหนด interval ไว้. */
  forceShowMaxXAxisLabel?: boolean
  /** เว้นระยะครึ่งช่วงข้อมูลที่ปลายแกน X ทั้งสองด้าน. */
  xAxisBoundaryGap?: boolean

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
  /** จำนวนหลักทศนิยมของค่าใน tooltip (เช่น 4 → "1.0000") — ถ้าไม่ส่งใช้
   *  `toLocaleString()` ปกติ (ตัดเลข 0 ท้ายทิ้ง). จำเป็นสำหรับค่าที่เล็กมาก
   *  (เช่น Amp 0.0002) ที่ default formatting จะปัดจนเหลือ "0" */
  tooltipValueDecimals?: number
  /** แสดงจุดสี (●) นำหน้า label ของแต่ละเส้นใน tooltip (default `false`) */
  tooltipShowDot?: boolean
  /** Render the tooltip header as a single left-aligned grey line (just
   *  `headerDate`, no border/second axisValue line) — use when `tooltipDateKey`
   *  already carries the full "date (weekday)" string. Default `false` keeps
   *  the original centered two-line header. */
  tooltipSimpleHeader?: boolean
  /** Extra rows shown in tooltip but NOT rendered as visible lines.
   *  Reads values from each data point via `dataKey`. */
  tooltipExtras?: TooltipExtra[]
  /** HTML ที่ต่อท้าย tooltip rows + extras — รับ `dataIndex` ของจุดที่ hover */
  tooltipFooter?: (dataIndex: number) => string
  /** สีของ subtitle (default: white/50) */
  subtitleColor?: string
}

interface TooltipParam {
  color: string
  value: number
  seriesName: string
  seriesIndex: number
  axisValue: string
  dataIndex: number
}

/** Minimum breathing room between two x-axis labels before the step widens. */
const X_LABEL_MIN_GAP = 8

/** Axis tick label. `Intl.NumberFormat` defaults to 3 fraction digits, which
 *  rounds anything below 0.0005 down to "0" — a chart of small readings (e.g.
 *  an Amp line around 0.0002 A) then renders every tick as "0" and the axis
 *  says nothing. Widen the precision just enough to keep small magnitudes
 *  distinguishable; values ≥ 1 keep the original 3-digit formatting. */
const formatAxisValue = (v: number) => {
  const abs = Math.abs(v)
  const digits = abs === 0 || abs >= 1
    ? 3
    : Math.min(20, Math.ceil(-Math.log10(abs)) + 1)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(v)
}

/** Extra left padding to reserve for the y-axis labels, in px.
 *
 *  `containLabel` sizes the gutter from ECharts' own text measurement, which
 *  uses the 11px it was handed in the option. Traffic-lighting / statistics
 *  screens then force every small inline font-size up to 14px !important
 *  (TrafficLightingMinimumFontSize), so the labels render ~27% wider than the
 *  space reserved for them and spill past the card's left edge, where
 *  `overflow-hidden` clips them — a long tick like "0.0004" lost its leading
 *  digits. Reserve the shortfall so the number is always fully visible;
 *  ~1.8px per character, which is a few px of harmless slack on screens that
 *  don't apply the override. */
const yAxisLabelPad = (labels: string[]) => {
  const maxChars = labels.reduce((m, l) => Math.max(m, l.length), 0)
  return maxChars > 0 ? Math.ceil(maxChars * 3 * 0.6) + 2 : 0
}

// ── Component ─────────────────────────────────────────────────────────────────

const LineChart: React.FC<LineChartProps> = ({
  className = 'relative rounded-2xl pt-5 px-5 pb-4 w-full h-full overflow-hidden',
  title,
  titleSize = 16,
  subtitle,
  subtitleSize = "var(--fs-12)",
  subtitleColor = '#8a9ab5',
  icon,
  data,
  lines,
  stats,
  periods,
  defaultPeriod,
  activePeriod: controlledActivePeriod,
  onPeriodChange,
  periodIcons,
  height = 260,
  fillHeight = false,
  fillHeightUnbounded = false,
  gridBottom = 28,
  gridTop = 16,
  yAxisTicks,
  yAxisDomain = [0, 'auto'],
  yAxisScale = false,
  secondaryYAxisTicks,
  secondaryYAxisDomain = [0, 'auto'],
  xAxisLabelRotate = 0,
  xAxisLabelMaxWidth,
  xAxisLabelInterval,
  xAxisLabelEvery,
  axisLabelColor = '#ffffff',
  preserveNullValues = false,
  forceShowMaxXAxisLabel = false,
  xAxisBoundaryGap = false,
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
  tooltipValueDecimals,
  tooltipShowDot = false,
  tooltipSimpleHeader = false,
  tooltipExtras,
  tooltipFooter,
}) => {
  const [internalActivePeriod, setInternalActivePeriod] = useState(defaultPeriod ?? periods?.[0] ?? '')
  const activePeriod = controlledActivePeriod ?? internalActivePeriod

  const handlePeriod = (p: string) => {
    if (controlledActivePeriod === undefined) setInternalActivePeriod(p)
    onPeriodChange?.(p)
  }

  // `xAxisLabelEvery` thins the x-axis labels by a fixed step, which stops
  // fitting once the card gets narrow (two 24h charts side by side on a
  // ~1000px screen left every label overlapping its neighbour). Track the
  // rendered width so the step can grow to match — only when a consumer
  // actually asked for stepped labels, so every other chart skips the work.
  const chartBoxRef = useRef<HTMLDivElement>(null)
  const [chartBoxWidth, setChartBoxWidth] = useState(0)
  const adaptiveLabels = xAxisLabelEvery !== undefined

  useEffect(() => {
    const node = chartBoxRef.current
    if (!adaptiveLabels || !node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      // Snap to a 16px grid — a drag-resize otherwise re-renders every frame
      // for changes far too small to alter how many labels fit.
      const snapped = Math.round(width / 16) * 16
      setChartBoxWidth((prev) => (prev === snapped ? prev : snapped))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [adaptiveLabels])

  /** Left gutter padding for the y-axis, derived from the tick labels that will
   *  actually be drawn. Explicit `yAxisTicks` are known outright; otherwise the
   *  formatter is sampled across the data's own range, which is what ECharts
   *  bases its auto ticks on — the widest label always comes from the smallest
   *  magnitude, since that is where {@link formatAxisValue} emits the most
   *  decimals. */
  const yAxisGutter = useMemo(() => {
    if (yAxisTicks?.length) return yAxisLabelPad(yAxisTicks.map(formatAxisValue))
    const values = data.flatMap((point) =>
      lines.map((line) => point[line.dataKey]).filter((v): v is number => typeof v === 'number'),
    )
    if (values.length === 0) return 0
    const maxAbs = Math.max(...values.map(Math.abs))
    if (maxAbs === 0) return 0
    // ECharts lands on ~4–5 ticks, so the smallest is around a fifth of the top.
    return yAxisLabelPad([maxAbs, maxAbs / 5].map(formatAxisValue))
  }, [yAxisTicks, data, lines])

  /** The step actually used for x-axis labels: `xAxisLabelEvery` when it fits,
   *  otherwise the next multiple of it that does. Staying on a multiple keeps
   *  the shown labels a subset of the ones the consumer asked for (an hourly
   *  axis stepped by 2 thins to 4 then 6 — always even hours, never odd) and
   *  keeps every gap equal. */
  const effectiveLabelEvery = useMemo(() => {
    if (xAxisLabelEvery === undefined) return undefined
    const base = Math.max(1, xAxisLabelEvery)
    const lastIndex = data.length - 1
    if (lastIndex <= 0 || chartBoxWidth <= 0) return base
    // Widest label, converted to px at the axis font. Traffic-lighting screens
    // force a 14px floor over ECharts' inline size (see
    // TrafficLightingMinimumFontSize), so measure against that, not the 11px
    // the option asks for — otherwise the fit is under-estimated and labels
    // still collide.
    const maxChars = data.reduce((m, d) => Math.max(m, String(d.label ?? '').length), 0)
    const labelWidth = Math.max(1, maxChars * 14 * 0.52)
    // The plot is narrower than the card: y-axis labels on the left plus the
    // grid's right padding. Under-estimating only costs a label, so keep it
    // conservative rather than risk another overlap.
    const available = Math.max(0, chartBoxWidth - 56)
    const fits = Math.max(1, Math.floor((available + X_LABEL_MIN_GAP) / (labelWidth + X_LABEL_MIN_GAP)))
    for (let multiple = 1; ; multiple++) {
      const step = base * multiple
      const shown = Math.floor(lastIndex / step) + 1
      if (shown <= fits || step >= lastIndex) return step
    }
  }, [xAxisLabelEvery, chartBoxWidth, data])

  const option = useMemo(() => {
    const yMin = yAxisTicks ? yAxisTicks[0] : yAxisDomain[0] === 'auto' ? undefined : yAxisDomain[0]
    const yMax = yAxisTicks ? yAxisTicks[yAxisTicks.length - 1] : yAxisDomain[1] === 'auto' ? undefined : yAxisDomain[1]
    const yInterval = yAxisTicks && yAxisTicks.length >= 2 ? yAxisTicks[1] - yAxisTicks[0] : undefined

    // A second (right-hand) axis is only built when a line actually opts in via
    // `yAxisIndex: 1` — every other consumer keeps the original single-axis
    // object shape untouched.
    const hasSecondaryAxis = lines.some((line) => line.yAxisIndex === 1)
    const secondaryYMin = secondaryYAxisTicks
      ? secondaryYAxisTicks[0]
      : secondaryYAxisDomain[0] === 'auto' ? undefined : secondaryYAxisDomain[0]
    const secondaryYMax = secondaryYAxisTicks
      ? secondaryYAxisTicks[secondaryYAxisTicks.length - 1]
      : secondaryYAxisDomain[1] === 'auto' ? undefined : secondaryYAxisDomain[1]
    const secondaryYInterval = secondaryYAxisTicks && secondaryYAxisTicks.length >= 2
      ? secondaryYAxisTicks[1] - secondaryYAxisTicks[0]
      : undefined

    const primaryYAxis = {
      type: 'value',
      scale: yAxisScale,
      min: yMin,
      max: yMax,
      ...(yInterval ? { interval: yInterval } : {}),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: axisLabelColor,
        fontSize: "var(--fs-12)",
        // Full integer with thousands separator — no `K` suffix.
        formatter: formatAxisValue,
        // Same fix as the x-axis: when the card (esp. a `fillHeight` one)
        // shrinks on a small/resized screen, the plot area gets short enough
        // that the ~5 auto-computed ticks no longer have room between them
        // and their labels render on top of each other. `hideOverlap` drops
        // whichever labels collide instead of stacking them illegibly.
        hideOverlap: true,
      },
      splitLine: { lineStyle: { color: '#1f2d3d', type: 'solid' } },
    }

    return {
      backgroundColor: 'transparent',
      grid: { top: gridTop, right: 16, bottom: gridBottom, left: 8 + yAxisGutter, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: axisLabelColor,
          fontSize: "var(--fs-12)",
          // Keep the line flush to both edges (boundaryGap:false) while stopping
          // the first/last category labels from overflowing past the card edge:
          // align the first label to the left and the last to the right.
          // BUT: alignMin/Max don't play nice with rotated labels — the rotation
          // origin conflicts with the alignment and the first/last labels end
          // up floating (e.g. "00.00" drifts up next to the y-axis). Only apply
          // the alignment when labels are NOT rotated.
          ...(xAxisLabelRotate || xAxisLabelInterval !== undefined || xAxisLabelEvery !== undefined
            ? {}
            : { alignMinLabel: 'left', alignMaxLabel: 'right' }),
          // When `xAxisLabelInterval` is explicit → let it control spacing evenly
          // (turn off showMaxLabel so the forced-last label doesn't break the
          // uniform interval). Otherwise fall back to auto-thinning w/ hideOverlap.
          showMinLabel: true,
          showMaxLabel: forceShowMaxXAxisLabel || xAxisLabelEvery !== undefined || xAxisLabelInterval === undefined,
          ...(effectiveLabelEvery !== undefined
            ? {
              // `interval: 0` keeps EVERY category on the axis so no data point
              // is dropped from the line — only the label text is blanked out
              // by the formatter below.
              interval: 0,
              // Thinning is already width-aware via `effectiveLabelEvery`, so
              // ECharts must not drop labels on its own — its greedy
              // left-to-right hiding would break the even spacing.
              hideOverlap: false,
              formatter: (value: string, index: number) => index % effectiveLabelEvery === 0 ? value : '',
            }
            : xAxisLabelInterval === undefined
              ? { hideOverlap: true }
              : { interval: xAxisLabelInterval }),
          ...(xAxisLabelRotate ? { rotate: xAxisLabelRotate } : {}),
          ...(typeof xAxisLabelMaxWidth === 'number'
            ? { width: xAxisLabelMaxWidth, overflow: 'truncate' }
            : {}),
        },
        splitLine: { show: false },
        boundaryGap: xAxisBoundaryGap,
      },
      yAxis: hasSecondaryAxis
        ? [
          { ...primaryYAxis, position: 'left' },
          {
            type: 'value',
            scale: yAxisScale,
            min: secondaryYMin,
            max: secondaryYMax,
            ...(secondaryYInterval ? { interval: secondaryYInterval } : {}),
            position: 'right',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: axisLabelColor,
              fontSize: "var(--fs-12)",
              formatter: (v: number) => new Intl.NumberFormat('en-US').format(v),
              hideOverlap: true,
            },
            // Only the primary axis draws grid split-lines — a second set
            // at a different scale would misalign and clutter the plot.
            splitLine: { show: false },
          },
        ]
        : primaryYAxis,
      tooltip: {
        trigger: 'axis',
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
            ? (tooltipSimpleHeader
              ? `<div style="color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:12px;">${headerDate}</div>`
              : `<div style="text-align:center;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;">
                 <div style="color:#fff;font-size:13px;font-weight:600;">${headerDate}</div>
                 <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px;">${params[0]?.axisValue ?? ''}${tooltipDateSuffix}</div>
               </div>`)
            : // When labels are truncated, surface the full category in the tooltip.
            typeof xAxisLabelMaxWidth === 'number' && params[0]?.axisValue
              ? `<div style="color:#fff;font-weight:600;margin-bottom:6px;max-width:260px;white-space:normal;line-height:1.4">${params[0].axisValue}</div>`
              : ''
          const rows = params
            .map((p) => {
              const cfg = lines[p.seriesIndex]
              if (cfg?.hideInTooltip) return ''
              // A gap in the series (a null point kept by `preserveNullValues`,
              // e.g. an hour that has no reading yet) arrives here as
              // null/undefined — `Number()` turns it into NaN and the row would
              // read "NaN". Drop the row so the tooltip only lists points that
              // actually have a value.
              const numericValue = Number(p.value)
              if (!Number.isFinite(numericValue)) return ''
              const color = cfg?.color ?? p.color
              const label = cfg?.label ?? p.seriesName
              const value = tooltipValueDecimals != null
                ? numericValue.toFixed(tooltipValueDecimals)
                : numericValue.toLocaleString()
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

          // Every series is a gap at this point (and nothing else to show) —
          // return '' so ECharts hides the tooltip entirely instead of
          // popping an empty box with just a date in it.
          if (!rows && !extras && !footer) return ''

          return header + rows + extras + footer
        },
      },
      series: lines.map((line) => {
        const lineData = data.map((d) => {
          const value = d[line.dataKey]
          return preserveNullValues && (value === null || value === undefined)
            ? null
            : value ?? 0
        })
        // A perfectly flat line (every defined point at the same y, e.g. a
        // steady voltage reading) gives the SVG <path> a zero-height bounding
        // box. The shadowBlur glow below renders as an SVG filter whose
        // region is a % of that bbox (objectBoundingBox, default
        // -10%/-10%/120%/120%) — zero height collapses the region to nothing,
        // and Chromium's SVG renderer drops the ENTIRE filtered path
        // (stroke included), making the line invisible even though the data
        // is valid. Skip the glow on flat lines to avoid this.
        const definedValues = lineData.filter((v): v is number => v !== null)
        const isFlat = new Set(definedValues).size <= 1
        return {
          name: line.label,
          type: 'line',
          yAxisIndex: line.yAxisIndex ?? 0,
          // Flat reference/dashed guidelines look wrong when smoothed — the
          // smoothing tries to curve a straight horizontal line into a spline
          // and the shadow bleeds between dashes. Keep smoothing for real
          // data lines only.
          smooth: !line.dashed,
          data: lineData,
          lineStyle: {
            color: line.color,
            width: 3,
            // Glow shadow hides the gaps in a dashed line — disable it there.
            // Also disabled for flat lines — see `isFlat` comment above.
            shadowBlur: line.dashed || isFlat ? 0 : 12,
            shadowColor: line.color + '60',
            // Explicit dash pattern is more visible than echarts' default
            // 'dashed' (which draws very short segments).
            type: line.dashed ? [10, 6] : 'solid',
          },
          itemStyle: { color: line.color },
          symbol: 'circle',
          symbolSize: 8,
          // A single point has no line segment to draw, so it'd otherwise be
          // completely invisible (showSymbol only turns on for >1 point, where
          // the line itself is already visible without a symbol on every point).
          showSymbol: data.length <= 1,
          emphasis: { showSymbol: true, scale: 1.4 },
          areaStyle: null,
          // Force dashed reference lines above the real data curve so they
          // stay visible even when the curve crosses them.
          z: line.dashed ? 3 : 2,
        }
      }),
    }
  }, [data, lines, yAxisTicks, yAxisDomain, yAxisScale, secondaryYAxisTicks, secondaryYAxisDomain, tooltipDate, tooltipDateKey, tooltipDateSuffix, tooltipUnit, tooltipValueDecimals, tooltipShowDot, tooltipSimpleHeader, tooltipExtras, tooltipFooter, xAxisLabelRotate, xAxisLabelMaxWidth, xAxisLabelInterval, xAxisLabelEvery, effectiveLabelEvery, axisLabelColor, preserveNullValues, forceShowMaxXAxisLabel, xAxisBoundaryGap, gridBottom, gridTop, yAxisGutter])

  return (
    <div
      className={`${className} ${fillHeight ? ' flex flex-col' : ''}`}
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
                className='leading-tight'
                style={{ color: accentColor, fontSize: titleSize, fontWeight: 400 }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ color: subtitleColor, fontSize: subtitleSize }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Period tabs */}
        {periods && periods.length > 0 && (
          <div
            className='flex gap-1 rounded-full p-1 fs-12'
            style={{ background: '#A2A2A233' }}
          >
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className='px-4 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5'
                style={
                  activePeriod === p
                    ? { background: '#0d0d0d', color: '#eab308', fontWeight: 600 }
                    : { color: '#c9b97a' }
                }
              >
                {periodIcons?.[p]}
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
                <p className='fs-12 mt-0.5' style={{ color: stat.color }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ECharts */}
      <div ref={chartBoxRef} className={`relative ${fillHeight ? ` figure-large ${fillHeightUnbounded ? 'lg:h-full lg:min-h-0! lg:max-h-none!' : 'lg:h-72! lg:min-h-0! lg:max-h-none!'}` : ''}`}>
        <ReactECharts
          option={option}
          style={{ height: fillHeight ? '100%' : height }}
          notMerge
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  )
}

export default React.memo(LineChart)
