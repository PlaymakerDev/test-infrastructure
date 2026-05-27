"use client"
import React, { useMemo } from 'react'
import { TbChartBar } from 'react-icons/tb'
import BarChart, {
  type BarChartDataPoint,
  type BarChartStat,
} from '@/components/chart/Barchart'
import { PHASE_COLORS } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

interface Props { }

/** Real-time performance — grouped bars per phase, per hour.
 *  Stats above the chart mirror the first chart's layout. */
const HOURS: BarChartDataPoint[] = [
  { label: '15:00', p1: 87, p2: 83, p3: 85, p4: 79 },
  { label: '16:00', p1: 75, p2: 70, p3: 80, p4: 60 },
  { label: '17:00', p1: 78, p2: 72, p3: 76, p4: 70 },
  { label: '18:00', p1: 82, p2: 76, p3: 78, p4: 72 },
  { label: '19:00', p1: 85, p2: 78, p3: 82, p4: 76 },
  { label: '20:00', p1: 80, p2: 74, p3: 78, p4: 70 },
]

const ALL_BARS = [
  { dataKey: 'p1', color: PHASE_COLORS[0], label: 'Phase 1' },
  { dataKey: 'p2', color: PHASE_COLORS[1], label: 'Phase 2' },
  { dataKey: 'p3', color: PHASE_COLORS[2], label: 'Phase 3' },
  { dataKey: 'p4', color: PHASE_COLORS[3], label: 'Phase 4' },
]

const ALL_STATS: BarChartStat[] = [
  { value: '87%', label: 'Phase 1', color: PHASE_COLORS[0] },
  { value: '83%', label: 'Phase 2', color: PHASE_COLORS[1] },
  { value: '85%', label: 'Phase 3', color: PHASE_COLORS[2] },
  { value: '79%', label: 'Phase 4', color: PHASE_COLORS[3] },
]

const ChartRealtimePerformanceTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  // 3-phase signal → only 3 grouped bars per hour. 4-phase → all 4.
  const bars = useMemo(() => ALL_BARS.slice(0, project.phase), [project.phase])
  const stats = useMemo(() => ALL_STATS.slice(0, project.phase), [project.phase])

  return (
    <BarChart
      title='สถิติการวิเคราะห์ประสิทธิภาพแบบ Real-time'
      subtitle='เปรียบเทียบประสิทธิภาพการวิเคราะห์ของระบบตามช่วงเวลา'
      icon={<TbChartBar size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={HOURS}
      bars={bars}
      stats={stats}
      height={260}
      yAxisTicks={[0, 25, 50, 75, 100]}
    />
  )
}

export default React.memo<Props>(ChartRealtimePerformanceTrafficSignal)
