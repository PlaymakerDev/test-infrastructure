"use client"
import React, { useMemo } from 'react'
import { TbBolt } from 'react-icons/tb'
import LineChart, {
  type LineChartDataPoint,
  type LineConfig,
} from '@/components/chart/LineChart'
import { APIResponsePostPmChart, PmChartData } from '@/types/bridge-lighting/overall-api'

interface Props {
  pmChartData?: APIResponsePostPmChart
  isPmChartSuccess?: boolean
}

const VOLTAGE_LINES: LineConfig[] = [
  { dataKey: 'p1', color: '#00AEFF', label: 'Phase 1' },
  { dataKey: 'p2', color: '#05F2DB', label: 'Phase 2' },
  { dataKey: 'p3', color: '#7BFF66', label: 'Phase 3' },
]

const CURRENT_LINES: LineConfig[] = [
  { dataKey: 'p1', color: '#FFE100', label: 'Phase 1' },
  { dataKey: 'p2', color: '#FF6200', label: 'Phase 2' },
  { dataKey: 'p3', color: '#FF66CC', label: 'Phase 3' },
]

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const formatThaiDate = (d: Date) =>
  `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`

const formatBucketLabel = (bucket: string) => {
  const d = new Date(bucket)
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}

const buildPoints = (
  list: PmChartData[],
  keys: { p1: keyof PmChartData; p2: keyof PmChartData; p3: keyof PmChartData }
): LineChartDataPoint[] =>
  list.map((item) => ({
    label: formatBucketLabel(item.bucket),
    p1: parseFloat(item[keys.p1] as string) || 0,
    p2: parseFloat(item[keys.p2] as string) || 0,
    p3: parseFloat(item[keys.p3] as string) || 0,
  }))

interface Stats {
  min: number
  max: number
  avg: number
  latest: { p1: number; p2: number; p3: number }
  domain: [number, number]
  ticks: number[]
}

/** Compute per-chart Y-axis domain + stats badge from the loaded data.
 *  - Only positive readings count (zeros are gaps in the shelly feed).
 *  - Pad the observed range by 2 % (min padFloor) so the traces don't hug
 *    the plot edges but the variation still fills most of the chart.
 *  - 5 evenly-spaced ticks so the axis reads cleanly. */
const computeStats = (
  data: LineChartDataPoint[],
  padFloor: number,
  decimals: number,
): Stats | null => {
  const vals: number[] = []
  for (const row of data) {
    for (const k of ['p1', 'p2', 'p3'] as const) {
      const v = row[k]
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) vals.push(v)
    }
  }
  if (vals.length === 0) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const avg = vals.reduce((n, v) => n + v, 0) / vals.length
  const pad = Math.max(padFloor, (max - min) * 0.02 + padFloor * 0.5)
  // Round bounds to a nicer step so tick labels are readable.
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
  const latest = data[data.length - 1]
  return {
    min,
    max,
    avg,
    latest: {
      p1: (latest?.p1 as number) ?? 0,
      p2: (latest?.p2 as number) ?? 0,
      p3: (latest?.p3 as number) ?? 0,
    },
    domain: [lower, upper],
    ticks,
  }
}

interface StatsStripProps {
  stats: Stats
  unit: string
  decimals: number
  accent: string
}

const StatsStrip: React.FC<StatsStripProps> = ({ stats, unit, decimals, accent }) => {
  const fmt = (n: number) => n.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] tabular-nums'>
      <div>
        <span className='text-white/50'>ต่ำสุด </span>
        <span className='text-white font-semibold'>{fmt(stats.min)}</span>
        <span className='text-white/40 ml-0.5'>{unit}</span>
      </div>
      <div>
        <span className='text-white/50'>เฉลี่ย </span>
        <span className='font-semibold' style={{ color: accent }}>
          {fmt(stats.avg)}
        </span>
        <span className='text-white/40 ml-0.5'>{unit}</span>
      </div>
      <div>
        <span className='text-white/50'>สูงสุด </span>
        <span className='text-white font-semibold'>{fmt(stats.max)}</span>
        <span className='text-white/40 ml-0.5'>{unit}</span>
      </div>
      <div className='ms-auto flex items-center gap-2'>
        {(
          [
            { key: 'p1', color: '#00AEFF' },
            { key: 'p2', color: '#05F2DB' },
            { key: 'p3', color: '#7BFF66' },
          ] as const
        ).map((p) => (
          <div key={p.key} className='flex items-center gap-1'>
            <span
              className='inline-block w-1.5 h-1.5 rounded-full'
              style={{ background: p.color }}
            />
            <span className='text-white/80'>
              {fmt(stats.latest[p.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Voltage + Current 24-hour line charts.
 *  Two design changes to make the tiny per-phase variation readable:
 *    - Tight Y-axis: computed [min, max] + 2 % padding (or padFloor min),
 *      rounded to a nice 5-step tick grid. Prior fixed [0, 260] hid most
 *      of the shape; auto-domain fills the plot with real variation.
 *    - Live stats strip above each chart — min / avg / max + latest per-
 *      phase reading. Gives the user a numeric reference for how much
 *      the chart is really changing. */
const ChartElectricalBridgeLighting: React.FC<Props> = ({
  pmChartData,
  isPmChartSuccess,
}) => {
  const voltageData = useMemo(
    () => buildPoints(pmChartData ?? [], { p1: 'v_l1', p2: 'v_l2', p3: 'v_l3' }),
    [pmChartData],
  )
  const currentData = useMemo(
    () => buildPoints(pmChartData ?? [], { p1: 'i_l1', p2: 'i_l2', p3: 'i_l3' }),
    [pmChartData],
  )
  const voltageStats = useMemo(() => computeStats(voltageData, 1, 1), [voltageData])
  const currentStats = useMemo(() => computeStats(currentData, 0.05, 2), [currentData])
  const tooltipDate = useMemo(() => {
    const latest = pmChartData?.[pmChartData.length - 1]
    return formatThaiDate(latest ? new Date(latest.bucket) : new Date())
  }, [pmChartData])

  if (!isPmChartSuccess) return null

  return (
    <div className='flex flex-col gap-3 lg:h-full'>
      <div className='h-55 lg:h-auto lg:flex-1 lg:min-h-0 flex flex-col gap-1'>
        {voltageStats && (
          <StatsStrip
            stats={voltageStats}
            unit='V'
            decimals={1}
            accent='#FCD116'
          />
        )}
        <div className='flex-1 min-h-0'>
          <LineChart
            title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
            icon={<TbBolt size={18} />}
            data={voltageData}
            lines={VOLTAGE_LINES}
            fillHeight
            yAxisTicks={voltageStats?.ticks}
            yAxisDomain={voltageStats?.domain ?? [0, 260]}
            titleSize={16}
            accentColor='#FCD116'
            cardBackground='#000000CC'
            cardBorderColor='rgba(255,255,255,0.12)'
            showGlow={false}
            iconCircle={false}
            tooltipDate={tooltipDate}
            tooltipUnit='V'
            tooltipShowDot
          />
        </div>
      </div>
      <div className='h-55 lg:h-auto lg:flex-1 lg:min-h-0 flex flex-col gap-1'>
        {currentStats && (
          <StatsStrip
            stats={currentStats}
            unit='A'
            decimals={2}
            accent='#66AEFF'
          />
        )}
        <div className='flex-1 min-h-0'>
          <LineChart
            title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
            icon={<TbBolt size={18} />}
            data={currentData}
            lines={CURRENT_LINES}
            fillHeight
            yAxisTicks={currentStats?.ticks}
            yAxisDomain={currentStats?.domain ?? [0, 5]}
            titleSize={16}
            accentColor='#66AEFF'
            cardBackground='#000000CC'
            cardBorderColor='rgba(255,255,255,0.12)'
            showGlow={false}
            iconCircle={false}
            tooltipDate={tooltipDate}
            tooltipUnit='A'
            tooltipShowDot
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(ChartElectricalBridgeLighting)
