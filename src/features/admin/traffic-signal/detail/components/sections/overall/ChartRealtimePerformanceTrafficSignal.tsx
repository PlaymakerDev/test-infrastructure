"use client"
import React, { useMemo } from 'react'
import { TbChartBar } from 'react-icons/tb'
import dayjs from 'dayjs'
import BarChart, {
  type BarChartDataPoint,
  type BarChartStat,
} from '@/components/chart/Barchart'
import { getPhaseColor, phaseSeries, phasesFromRows } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficGraph } from '@/hooks/queries/traffic-signal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDateTimeBE } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'

interface Props { }

/** Full Thai date + time for the tooltip header — disambiguates repeated hours
 *  across days (e.g. 19:00 yesterday vs 19:00 today). พ.ศ. year. */
const fmtThaiDateTime = (iso: string): string => {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  return thaiDateTimeBE(iso)
}

const ChartRealtimePerformanceTrafficSignal: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const { data } = useTrafficGraph(project.id)

  // Phases come from the EFFICIENCY rows specifically — on solution 1582 the
  // efficiency graph carries 4 phases while the PCU graph carries 3, so this
  // chart cannot share a count with the volume chart (or with the junction's
  // declared `total_phases`, which is only the empty-response fallback).
  const phases = useMemo(() => {
    const eff = data?.efficentcy ?? data?.efficiency
    return phasesFromRows(eff?.graph, project.phase)
  }, [data, project.phase])
  const bars = useMemo(() => phaseSeries(phases), [phases])

  // `efficiency.graph` returns one row per (phase, hour) — group by hour to
  // form grouped bars `{ label, p1, p2, ... }`. Sort by timestamp first; key
  // the Map by full ISO timestamp so cross-day data (15:00 today vs 15:00
  // yesterday) doesn't collapse into one bucket.
  const hours = useMemo<BarChartDataPoint[]>(() => {
    const eff = data?.efficentcy ?? data?.efficiency
    const points = [...(eff?.graph ?? [])].sort(
      (a, b) =>
        new Date(a.hour_timestamp).getTime() - new Date(b.hour_timestamp).getTime(),
    )
    const byHour = new Map<string, BarChartDataPoint>()
    for (const p of points) {
      const phaseNo = p.phase_no ?? p.phases_no
      if (!phaseNo) continue
      const existing = byHour.get(p.hour_timestamp) ?? {
        label: dayjs(p.hour_timestamp).format('HH:mm'),
        tooltipLabel: fmtThaiDateTime(p.hour_timestamp),
      }
      existing[`p${phaseNo}`] = p.efficiency
      byHour.set(p.hour_timestamp, existing)
    }
    return Array.from(byHour.values())
  }, [data])

  const stats: BarChartStat[] = useMemo(() => {
    const eff = data?.efficentcy ?? data?.efficiency
    // `phases_avg` is positional and pairs with `phases_label`; both line up
    // with the phases present in `graph`, so index by position and colour by
    // the real phase number.
    const avgs = eff?.phases_avg ?? []
    const labels = eff?.phases_label ?? []
    return phases.map((no, i) => ({
      value: `${fmtNumber(avgs[i], 0)}%`,
      label: labels[i] ?? `Phase ${no}`,
      color: getPhaseColor(no),
    }))
  }, [data, phases])

  return (
    <BarChart
      cardClassName='h-full'
      title='สถิติการวิเคราะห์ประสิทธิภาพแบบ Real-time'
      subtitle='เปรียบเทียบประสิทธิภาพการวิเคราะห์ของระบบตามช่วงเวลา'
      icon={<TbChartBar size={30} />}
      accentColor='#66AEFF'
      iconCircle={false}
      showGlow={false}
      data={hours}
      bars={bars}
      stats={stats}
      height={260}
      yAxisTicks={[0, 25, 50, 75, 100]}
    />
  )
}

export default React.memo<Props>(ChartRealtimePerformanceTrafficSignal)
