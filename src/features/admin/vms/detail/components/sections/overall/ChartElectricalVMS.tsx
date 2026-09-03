"use client"
import React, { useMemo, useState } from 'react'
import { Col, Empty, Row, Skeleton } from 'antd'
import { TbBolt } from 'react-icons/tb'
import LineChart, {
  type LineChartDataPoint,
  type LineChartStat,
  type LineConfig,
} from '@/components/chart/LineChart'
import { AxiosError } from 'axios'
import { useVMSPmChartHour } from '../../../hooks'
import type { PmChartData } from '@/types/vms/pm-api'

interface Props {
  solutionId?: number
}

/** Single-phase PM charts for the VMS detail page (ported from
 *  bridge-lighting's ChartElectricalBridgeLighting, one trace instead of
 *  Phase 1–3; card chrome mirrors this page's WeatherChart). Each card has a
 *  24 ชม. / 7 วัน / 30 วัน period tab (LineChart's own `periods` UI, per
 *  2026-09-02 request) and sources HOURLY buckets from `/vms/pm-chart-hour` —
 *  the 5-minute `/vms/pm-chart` feed was judged too fine-grained for this
 *  view; its service fn + useVMSPmChart hook are kept should a detailed mode
 *  come back. Both cards on the same period share one TanStack cache entry. */

type Period = '24 ชม.' | '7 วัน' | '30 วัน'
const PERIODS: Period[] = ['24 ชม.', '7 วัน', '30 วัน']

/** CE YYYY-MM-DD range per period. `/vms/pm-chart-hour` dates are inclusive
 *  whole days, so "24 ชม." fetches yesterday+today and trims client-side. */
const PERIOD_DAYS: Record<Period, number> = { '24 ชม.': 1, '7 วัน': 6, '30 วัน': 29 }
/** Axis-label sampling (points are hourly): every 2 h for the 24-h view —
 *  auto labelled every single hour, too dense (2026-09-02 feedback) — and one
 *  label per day (7 วัน) / every 3 days (30 วัน) for the multi-day views. */
const PERIOD_LABEL_EVERY: Record<Period, number | undefined> = {
  '24 ชม.': 2,
  '7 วัน': 24,
  '30 วัน': 72,
}

const toYYYYMMDD = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const periodRange = (period: Period): { start: string; end: string } => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - PERIOD_DAYS[period])
  return { start: toYYYYMMDD(start), end: toYYYYMMDD(now) }
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const formatThaiDate = (d: Date) =>
  `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`

const formatTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`

// "NaN"-string safe — parseFloat("NaN") is NaN, which || would keep as falsy
// but Number.isFinite makes the intent explicit.
const num = (v: string) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

/** `dateLabel` rides along for the tooltip: the windows cross midnight, so a
 *  single static tooltip date labelled every point with the LAST bucket's
 *  date (caught on the Amp chart's left edge, 2026-09-02).
 *  - 24 ชม.: axis = HH.MM, tooltip = two-line "date / time น." header.
 *  - 7/30 วัน: axis = "D ก.ย." (sampled daily), the axis label carries no
 *    time — so the tooltip switches to `tooltipSimpleHeader` with the full
 *    date+time in `dateLabel` instead of the axisValue line. */
const buildPoints = (
  list: PmChartData[],
  key: keyof PmChartData,
  period: Period,
): LineChartDataPoint[] =>
  list.map((item) => {
    const d = new Date(item.bucket)
    return period === '24 ชม.'
      ? {
        label: formatTime(d),
        dateLabel: formatThaiDate(d),
        value: num(item[key] as string),
      }
      : {
        label: `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`,
        dateLabel: `${formatThaiDate(d)} · ${formatTime(d)} น.`,
        value: num(item[key] as string),
      }
  })

interface Stats {
  min: number
  max: number
  avg: number
  latest: number
  domain: [number, number]
  ticks: number[]
}

/** Same tight-Y-axis + 5-tick maths as the bridge charts (only positive
 *  readings count; zeros are meter-feed gaps). */
const computeStats = (
  data: LineChartDataPoint[],
  padFloor: number,
  decimals: number,
): Stats | null => {
  const vals: number[] = []
  for (const row of data) {
    const v = row.value
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) vals.push(v)
  }
  if (vals.length === 0) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const avg = vals.reduce((n, v) => n + v, 0) / vals.length
  const pad = Math.max(padFloor, (max - min) * 0.02 + padFloor * 0.5)
  const roundStep = (rng: number) => {
    const r = rng / 4
    const mag = Math.pow(10, Math.floor(Math.log10(r)))
    const norm = r / mag
    let step = 1
    if (norm >= 5) step = 5
    else if (norm >= 2) step = 2
    return step * mag
  }
  const step = roundStep((max + pad) - Math.max(0, min - pad))
  const lower = Math.max(0, Math.floor((min - pad) / step) * step)
  const upper = Math.ceil((max + pad) / step) * step
  const ticks: number[] = []
  for (let v = lower; v <= upper + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(decimals + 2)))
  }
  const latestRow = data[data.length - 1]
  return {
    min,
    max,
    avg,
    latest: (latestRow?.value as number) ?? 0,
    domain: [lower, upper],
    ticks,
  }
}

/** ต่ำสุด/เฉลี่ย/สูงสุด/ล่าสุด tiles for LineChart's `stats` prop — value
 *  formatted here (the prop's own number path has no decimals control).
 *  2 decimals across the board per 2026-09-02 request. */
const buildStatTiles = (
  stats: Stats | null,
  unit: string,
  accent: string,
  lineColor: string,
): LineChartStat[] => {
  if (!stats) return []
  const fmt = (n: number) => n.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return [
    { value: fmt(stats.min), label: `ต่ำสุด (${unit})`, color: '#9CA3AF' },
    { value: fmt(stats.avg), label: `เฉลี่ย (${unit})`, color: accent },
    { value: fmt(stats.max), label: `สูงสุด (${unit})`, color: '#9CA3AF' },
    { value: fmt(stats.latest), label: `ล่าสุด (${unit})`, color: lineColor },
  ]
}

interface CardSpec {
  title: string
  dataKey: 'v_avg' | 'i_avg'
  unit: string
  accent: string
  lines: LineConfig[]
  padFloor: number
  decimals: number
  fallbackDomain: [number, number]
}

const CARD_SPECS: Record<'volt' | 'amp', CardSpec> = {
  volt: {
    title: 'แรงดันไฟฟ้าภายในตู้ควบคุม (Volt)',
    dataKey: 'v_avg',
    unit: 'V',
    accent: '#FCD116',
    lines: [{ dataKey: 'value', color: '#00AEFF', label: 'แรงดันไฟฟ้า' }],
    padFloor: 1,
    decimals: 1,
    fallbackDomain: [0, 260],
  },
  amp: {
    title: 'กระแสไฟฟ้าภายในตู้ควบคุม (Amp)',
    dataKey: 'i_avg',
    unit: 'A',
    accent: '#66AEFF',
    lines: [{ dataKey: 'value', color: '#FFE100', label: 'กระแสไฟฟ้า' }],
    padFloor: 0.05,
    decimals: 2,
    fallbackDomain: [0, 5],
  },
}

const PmChartCard: React.FC<{ solutionId?: number; kind: 'volt' | 'amp' }> = ({ solutionId, kind }) => {
  const spec = CARD_SPECS[kind]
  const [period, setPeriod] = useState<Period>('24 ชม.')
  const { start, end } = useMemo(() => periodRange(period), [period])
  const query = useVMSPmChartHour(solutionId, start, end, true)

  const rows = useMemo(() => {
    const list = Array.isArray(query.data?.data) ? query.data.data : []
    if (period !== '24 ชม.' || list.length === 0) return list
    // "24 ชม." fetches yesterday+today (inclusive whole days) — trim to the
    // trailing 24-hour window. Anchored on the LAST bucket, not Date.now():
    // render-pure (react-compiler lint) and still a full window when the
    // meter feed lags behind wall-clock time.
    const cutoff = new Date(list[list.length - 1].bucket).getTime() - 24 * 3600 * 1000
    return list.filter((r) => new Date(r.bucket).getTime() > cutoff)
  }, [query.data, period])

  const points = useMemo(() => buildPoints(rows, spec.dataKey, period), [rows, spec.dataKey, period])
  const stats = useMemo(() => computeStats(points, spec.padFloor, spec.decimals), [points, spec.padFloor, spec.decimals])

  // BE scopes pm-chart by the token's department: a bureau account asking
  // about an out-of-region sign gets 404 "vms wid not found for solution"
  // (verified live with drr-cmi vs drr, 2026-09-02). That's an empty, not a
  // failure — only non-404 errors surface as "โหลดไม่ได้".
  const errStatus = (query.error as AxiosError | null)?.response?.status
  const realError = query.isError && errStatus !== 404

  if (query.isLoading) {
    return (
      <div className='rounded-2xl bg-[#00000080] p-5'>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  return (
    <div className='relative'>
      <LineChart
        title={spec.title}
        icon={<TbBolt className='fs-22' />}
        data={points}
        lines={spec.lines}
        stats={buildStatTiles(stats, spec.unit, spec.accent, spec.lines[0].color)}
        periods={PERIODS}
        activePeriod={period}
        onPeriodChange={(p) => setPeriod(p as Period)}
        yAxisTicks={stats?.ticks}
        yAxisDomain={stats?.domain ?? spec.fallbackDomain}
        xAxisLabelEvery={PERIOD_LABEL_EVERY[period]}
        titleSize={16}
        accentColor={spec.accent}
        cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        iconCircle={false}
        tooltipDateKey='dateLabel'
        tooltipSimpleHeader={period !== '24 ชม.'}
        tooltipUnit={spec.unit}
        tooltipValueDecimals={2}
        tooltipShowDot
        height={260}
      />
      {/* Empty overlay over the (blank) plot area — kept INSIDE the card so
        * the period tabs stay usable: a sign can have no rows in the last
        * 24 h yet plenty in the 7/30-day windows (most signs have no meter
        * at all — 12/275 reported data on 2026-09-02). */}
      {points.length === 0 && (
        <div className='absolute inset-x-0 top-24 bottom-4 flex items-center justify-center pointer-events-none'>
          <Empty description={realError ? 'ไม่สามารถโหลดข้อมูลมิเตอร์ไฟฟ้าได้' : 'ไม่มีข้อมูลมิเตอร์ไฟฟ้าในช่วงเวลานี้'} />
        </div>
      )}
    </div>
  )
}

const ChartElectricalVMS: React.FC<Props> = ({ solutionId }) => (
  <Row gutter={[16, 16]}>
    <Col xs={24} xl={12}>
      <PmChartCard solutionId={solutionId} kind='volt' />
    </Col>
    <Col xs={24} xl={12}>
      <PmChartCard solutionId={solutionId} kind='amp' />
    </Col>
  </Row>
)

export default React.memo<Props>(ChartElectricalVMS)
