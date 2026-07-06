"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import dayjs from 'dayjs'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { PHASE_COLORS } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficGraph } from '@/hooks/queries/traffic-signal'
import { thaiDateBE } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'

interface Props { }

const ALL_LINES = [
  { dataKey: 'p1', color: PHASE_COLORS[0], label: 'Phase 1' },
  { dataKey: 'p2', color: PHASE_COLORS[1], label: 'Phase 2' },
  { dataKey: 'p3', color: PHASE_COLORS[2], label: 'Phase 3' },
  { dataKey: 'p4', color: PHASE_COLORS[3], label: 'Phase 4' },
]

/** Group PCU points (flat array from API) into per-hour series, one entry per
 *  `phases_no`. The chart's data shape requires `{ label, p1, p2, ... }`.
 *  Sorts by timestamp first — backend doesn't guarantee order — and keys the
 *  Map by full ISO timestamp so cross-day data (e.g. 15:00 today vs 15:00
 *  yesterday) doesn't collapse into one bucket. */
const buildHourSeries = (
  points: { phases_no: number; hour_timestamp: string; total_pcu: number }[]
): LineChartDataPoint[] => {
  const sorted = [...points].sort(
    (a, b) =>
      new Date(a.hour_timestamp).getTime() - new Date(b.hour_timestamp).getTime(),
  )
  const byHour = new Map<string, LineChartDataPoint>()
  for (const p of sorted) {
    const existing = byHour.get(p.hour_timestamp) ?? {
      label: dayjs(p.hour_timestamp).format('HH.mm'),
      dateLabel: thaiDateBE(p.hour_timestamp),
    }
    existing[`p${p.phases_no}`] = p.total_pcu
    byHour.set(p.hour_timestamp, existing)
  }
  return Array.from(byHour.values())
}

const ChartTrafficVolumeTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const { data } = useTrafficGraph(project.id)

  const lines = useMemo(() => ALL_LINES.slice(0, project.phase), [project.phase])

  const hours = useMemo(
    () => buildHourSeries(data?.traffic_pcu ?? []),
    [data]
  )

  const stats = useMemo(() => {
    // Sum each phase's total PCU for the day → header stats.
    const totals = [0, 0, 0, 0]
    for (const p of data?.traffic_pcu ?? []) {
      if (p.phases_no >= 1 && p.phases_no <= 4) {
        totals[p.phases_no - 1] += p.total_pcu
      }
    }
    return ALL_LINES.slice(0, project.phase).map((line, i) => ({
      value: totals[i],
      label: line.label,
      color: line.color,
    }))
  }, [data, project.phase])

  return (
    <LineChart
      title='ปริมาณจราจรสูงสุดย้อนหลังภายใน 24 ชั่วโมง'
      subtitle='เปรียบเทียบปริมาณจราจรแต่ละ Phase ตามช่วงเวลา'
      icon={<TbCar size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={hours}
      lines={lines}
      stats={stats}
      height={260}
      yAxisTicks={[0, 200, 400, 600, 800]}
      tooltipDateKey='dateLabel'
      tooltipUnit='PCU'
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartTrafficVolumeTrafficSignal)
