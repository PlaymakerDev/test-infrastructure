"use client"
import React, { useMemo } from 'react'
import { TbBolt } from 'react-icons/tb'
import LineChart, {
  type LineChartDataPoint,
  type LineConfig,
} from '@/components/chart/LineChart'

// ── Mock 24h data (3-hour steps, matching the previous static reference image) ──
const X_AXIS_LABELS = [
  '03.00', '06.00', '09.00', '12.00', '15.00', '18.00', '21.00', '24.00',
]

const VOLTAGE_SERIES = {
  p1: [230, 15, 175, 230, 128, 230, 230, 230],
  p2: [5, 60, 200, 231, 231, 231, 231, 231],
  p3: [5, 60, 200, 231, 231, 231, 231, 231],
}

const CURRENT_SERIES = {
  p1: [68, 3, 1, 1, 1, 2, 55, 70],
  p2: [75, 4, 1, 1, 1, 3, 60, 75],
  p3: [75, 4, 1, 1, 1, 3, 58, 74],
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

const buildPoints = (
  series: { p1: number[]; p2: number[]; p3: number[] }
): LineChartDataPoint[] =>
  X_AXIS_LABELS.map((label, i) => ({
    label,
    p1: series.p1[i],
    p2: series.p2[i],
    p3: series.p3[i],
  }))

/** Voltage + Current 24-hour line charts for the incident detail page.
 *  Replaces the old static `c1ex.png`/`c2ex.png` placeholder images with
 *  real `<LineChart>` instances (mock data — this feature has no backend
 *  cabinet-electrical endpoint, see `ChartElectricalBridgeLighting` for the
 *  same pattern used by `bridge-lighting`, also pure mock). */
const ChartElectricalIncident: React.FC = () => {
  const voltageData = useMemo(() => buildPoints(VOLTAGE_SERIES), [])
  const currentData = useMemo(() => buildPoints(CURRENT_SERIES), [])
  const tooltipDate = useMemo(() => formatThaiDate(new Date()), [])

  return (
    <div className='flex flex-col sm:flex-row gap-4 flex-1 min-w-0'>
      <div className='flex-1 min-w-0'>
        <LineChart
          title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
          icon={<TbBolt size={18} />}
          data={voltageData}
          lines={VOLTAGE_LINES}
          height={260}
          yAxisDomain={[0, 260]}
          titleSize={16}
          accentColor='#FCD116'
          cardBackground='#00000080'
          cardBorderColor='#1f2d3d'
          showGlow={false}
          iconCircle={false}
          tooltipDate={tooltipDate}
          tooltipUnit='V'
          tooltipShowDot
        />
      </div>
      <div className='flex-1 min-w-0'>
        <LineChart
          title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
          icon={<TbBolt size={18} />}
          data={currentData}
          lines={CURRENT_LINES}
          height={260}
          yAxisDomain={[0, 90]}
          titleSize={16}
          accentColor='#FCD116'
          cardBackground='#00000080'
          cardBorderColor='#1f2d3d'
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

export default React.memo(ChartElectricalIncident)
