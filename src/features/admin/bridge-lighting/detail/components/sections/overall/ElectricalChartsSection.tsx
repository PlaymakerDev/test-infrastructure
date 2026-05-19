"use client"
import React, { useMemo } from 'react'
import { TbBolt } from 'react-icons/tb'
import LineChart, {
  type LineChartDataPoint,
  type LineConfig,
} from '@/components/chart/LineChart'

interface Props {}

// ── Mock hourly data ──────────────────────────────────────────────────────────
// 13 points covering 00:00 → 24:00 (every 2 hours). Values dip near-zero in
// early morning when lights are off, then climb to nominal V/A once they
// come on for the evening.
const X_AXIS_LABELS = [
  '00.00', '02.00', '04.00', '06.00', '08.00', '10.00', '12.00',
  '14.00', '16.00', '18.00', '20.00', '22.00', '24.00',
]

const VOLTAGE_SERIES = {
  p1: [220, 210, 60, 100, 160, 230, 232, 230, 231, 230, 230, 231, 231],
  p2: [223, 215, 80, 110, 175, 232, 233, 231, 231, 232, 232, 232, 232],
  p3: [225, 220, 90, 130, 180, 234, 233, 232, 232, 231, 232, 231, 231],
}

const CURRENT_SERIES = {
  p1: [70, 50, 5, 3, 2, 1, 1, 1, 2, 5, 25, 55, 70],
  p2: [80, 60, 7, 4, 3, 2, 1, 2, 3, 6, 28, 60, 80],
  p3: [76, 55, 6, 4, 2, 1, 1, 1, 2, 5, 26, 56, 76],
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

/** Build LineChart-compatible data points from a 3-phase series object. */
const buildPoints = (
  series: { p1: number[]; p2: number[]; p3: number[] }
): LineChartDataPoint[] =>
  X_AXIS_LABELS.map((label, i) => ({
    label,
    p1: series.p1[i],
    p2: series.p2[i],
    p3: series.p3[i],
  }))

/** Voltage + Current 24-hour line charts.
 *  Both use the central `<LineChart>` with theme overrides (accent color,
 *  dark card bg, no golden glow, plain icon) plus a custom tooltip that
 *  shows Thai BE date + time + colored phase dots. */
const ElectricalChartsSection: React.FC<Props> = () => {
  const voltageData = useMemo(() => buildPoints(VOLTAGE_SERIES), [])
  const currentData = useMemo(() => buildPoints(CURRENT_SERIES), [])
  const tooltipDate = useMemo(() => formatThaiDate(new Date()), [])

  return (
    <div className='flex flex-col gap-3 flex-1 min-h-0'>
      <LineChart
        title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
        icon={<TbBolt size={18} />}
        data={voltageData}
        lines={VOLTAGE_LINES}
        height={180}
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
      <LineChart
        title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
        icon={<TbBolt size={18} />}
        data={currentData}
        lines={CURRENT_LINES}
        height={180}
        yAxisDomain={[0, 100]}
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
  )
}

export default React.memo<Props>(ElectricalChartsSection)
