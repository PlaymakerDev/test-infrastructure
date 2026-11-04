"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import dayjs from 'dayjs'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { phaseSeries, phasesFromRows } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficGraph } from '@/hooks/queries/traffic-signal'
import { thaiDateBE } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'

interface Props { }

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

  // Phases come from THIS chart's own rows — `project.phase` (total_phases)
  // disagrees with them on 10 junctions and is only the empty-response
  // fallback here. Slicing a fixed 4-line list by it drew phantom zero series
  // (ชร.1023 declares 4 phases, reports 1) and hid real ones (2026-10-26).
  const phases = useMemo(
    () => phasesFromRows(data?.traffic_pcu, project.phase),
    [data, project.phase],
  )
  const lines = useMemo(() => phaseSeries(phases), [phases])

  const hours = useMemo(
    () => buildHourSeries(data?.traffic_pcu ?? []),
    [data]
  )

  const stats = useMemo(() => {
    // Sum each phase's total PCU for the day → header stats. Keyed by phase
    // number (not array position) so a gap like phases [1, 3] still totals
    // into the right bucket.
    const totals = new Map<number, number>()
    for (const p of data?.traffic_pcu ?? []) {
      totals.set(p.phases_no, (totals.get(p.phases_no) ?? 0) + p.total_pcu)
    }
    return lines.map((line, i) => ({
      value: totals.get(phases[i]) ?? 0,
      label: line.label,
      color: line.color,
    }))
  }, [data, lines, phases])

  // The Y axis scales to the data (no `yAxisTicks`). A fixed 0–800 ceiling
  // CLIPPED every junction whose hourly PCU ran higher: ECharts drops the
  // out-of-range segments outright, so รย.4006's 1,047-PCU rush-hour crest
  // rendered as gaps along the 800 gridline and the chart under-reported the
  // peak (7 junctions nationwide exceed 800, up to 1,196 — surveyed
  // 2026-10-26). Quiet junctions had the mirror problem: a ~50-PCU day
  // squashed into a flat line on the baseline. LineChart's default
  // `yAxisDomain = [0, 'auto']` keeps the bottom pinned at zero, so only the
  // ceiling follows the data.
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
      tooltipDateKey='dateLabel'
      tooltipUnit='PCU'
      tooltipShowDot
    />
  )
}

export default React.memo<Props>(ChartTrafficVolumeTrafficSignal)
