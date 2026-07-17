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

/** "2026-07-17T01:20:00+07:00" → "01.20" — matches the chart's original
 *  dot-separated x-axis label style. */
const formatBucketLabel = (bucket: string) => {
  const d = new Date(bucket)
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}

/** Build LineChart-compatible data points from `pmChartData`, picking the
 *  per-phase field trio (voltage: v_l1/v_l2/v_l3, current: i_l1/i_l2/i_l3). */
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

/** Voltage + Current 24-hour line charts.
 *  Both use the central `<LineChart>` with theme overrides (accent color,
 *  dark card bg, no golden glow, plain icon) plus a custom tooltip that
 *  shows Thai BE date + time + colored phase dots. */
const ChartElectricalBridgeLighting: React.FC<Props> = (props) => {
  const { pmChartData, isPmChartSuccess } = props

  const voltageData = useMemo(
    () => buildPoints(pmChartData ?? [], { p1: 'v_l1', p2: 'v_l2', p3: 'v_l3' }),
    [pmChartData],
  )
  const currentData = useMemo(
    () => buildPoints(pmChartData ?? [], { p1: 'i_l1', p2: 'i_l2', p3: 'i_l3' }),
    [pmChartData],
  )
  // Same "latest reading" convention as VoltageStat — the last bucket is the
  // most recent sample, so its date drives the tooltip header.
  const tooltipDate = useMemo(() => {
    const latest = pmChartData?.[pmChartData.length - 1]
    return formatThaiDate(latest ? new Date(latest.bucket) : new Date())
  }, [pmChartData])

  if (!isPmChartSuccess) return null

  return (
    <div className='flex flex-col gap-3 lg:h-full'>
      <div className='h-55 lg:h-auto lg:flex-1 lg:min-h-0'>
        <LineChart
          title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
          icon={<TbBolt size={18} />}
          data={voltageData}
          lines={VOLTAGE_LINES}
          fillHeight
          yAxisDomain={[0, 260]}
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
      <div className='h-55 lg:h-auto lg:flex-1 lg:min-h-0'>
        <LineChart
          title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
          icon={<TbBolt size={18} />}
          data={currentData}
          lines={CURRENT_LINES}
          fillHeight
          // Real readings run ~0–1A (vs. the old mock's 0–100 scale) — auto-scale
          // the max instead of a fixed guess so the curve isn't squashed flat.
          yAxisDomain={[0, 'auto']}
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
  )
}

export default React.memo<Props>(ChartElectricalBridgeLighting)
