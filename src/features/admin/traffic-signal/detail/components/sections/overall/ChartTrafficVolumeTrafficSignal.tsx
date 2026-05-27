"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { PHASE_COLORS } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

interface Props { }

/** Hourly traffic volume — 24-hour data per phase. */
const HOURS: LineChartDataPoint[] = [
  { label: '00.00', p1: 80, p2: 60, p3: 50, p4: 40 },
  { label: '02.00', p1: 60, p2: 50, p3: 40, p4: 30 },
  { label: '04.00', p1: 90, p2: 80, p3: 70, p4: 60 },
  { label: '06.00', p1: 380, p2: 320, p3: 250, p4: 180 },
  { label: '08.00', p1: 820, p2: 750, p3: 600, p4: 460 },
  { label: '10.00', p1: 540, p2: 480, p3: 380, p4: 320 },
  { label: '12.00', p1: 460, p2: 410, p3: 320, p4: 280 },
  { label: '14.00', p1: 480, p2: 420, p3: 360, p4: 300 },
  { label: '16.00', p1: 620, p2: 560, p3: 460, p4: 400 },
  { label: '18.00', p1: 720, p2: 650, p3: 540, p4: 460 },
  { label: '20.00', p1: 264, p2: 138, p3: 23, p4: 6 },
  { label: '22.00', p1: 180, p2: 120, p3: 80, p4: 50 },
  { label: '24.00', p1: 80, p2: 60, p3: 50, p4: 40 },
]

const ALL_LINES = [
  { dataKey: 'p1', color: PHASE_COLORS[0], label: 'Phase 1' },
  { dataKey: 'p2', color: PHASE_COLORS[1], label: 'Phase 2' },
  { dataKey: 'p3', color: PHASE_COLORS[2], label: 'Phase 3' },
  { dataKey: 'p4', color: PHASE_COLORS[3], label: 'Phase 4' },
]

const ALL_STATS = [
  { value: 2684, label: 'Phase 1', color: PHASE_COLORS[0] },
  { value: 1934, label: 'Phase 2', color: PHASE_COLORS[1] },
  { value: 1382, label: 'Phase 3', color: PHASE_COLORS[2] },
  { value: 1902, label: 'Phase 4', color: PHASE_COLORS[3] },
]

const ChartTrafficVolumeTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  // Adapt to 3- or 4-phase signal — slice the configured lines/stats arrays.
  const lines = useMemo(() => ALL_LINES.slice(0, project.phase), [project.phase])
  const stats = useMemo(() => ALL_STATS.slice(0, project.phase), [project.phase])

  return (
    <LineChart
      title='ปริมาณจราจรสูงสุดย้อนหลังภายใน 24 ชั่วโมง'
      subtitle='เปรียบเทียบปริมาณจราจรแต่ละ Phase ตามช่วงเวลา'
      icon={<TbCar size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={HOURS}
      lines={lines}
      stats={stats}
      height={260}
      yAxisTicks={[0, 200, 400, 600, 800]}
      tooltipDate='20 เม.ย. 2569'
      tooltipUnit='PCU'
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartTrafficVolumeTrafficSignal)
