"use client"
import React, { useMemo } from 'react'
import { TbCirclesRelation } from 'react-icons/tb'
import PieChart, {
  type PieChartDataPoint,
  type PieChartOuterLabel,
} from '@/components/chart/PieChart'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

/** Traffic Signal Cycle — uses the central PieChart with outer labels.
 *  Donut sweeps counter-clockwise so phase order P1→P2→P3→P4 visually flows
 *  the same way as in the Figma reference. */
const TrafficCycleTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  const phases = project.phaseTiming ?? []

  const data: PieChartDataPoint[] = useMemo(
    () =>
      phases.map((p) => ({
        name: `P${p.phase}`,
        value: p.greenSec,
        color: getPhaseColor(p.phase),
      })),
    [phases]
  )

  const outerLabels: PieChartOuterLabel[] = useMemo(
    () =>
      phases.map((p) => ({
        title: `P${p.phase}`,
        subtitle: `${p.greenSec}s`,
        // Green dot — represents green-light time (not the phase color).
        dotColor: '#16FC2D',
      })),
    [phases]
  )

  const total = useMemo(
    () => phases.reduce((sum, p) => sum + p.greenSec, 0),
    [phases]
  )

  return (
    <PieChart
      title='Traffic Signal Cycle'
      titleSize={16}
      titleColor='#66AEFF'
      icon={<TbCirclesRelation size={22} color='#66AEFF' />}
      iconCircle={false}
      showGlow={false}
      cardBackground='#191919CC'
      data={data}
      clockwise={false}
      donutSize={160}
      outerLabelRadius={100}
      segmentBorderWidth={0}
      outerLabels={outerLabels}
      centerValue={`${total}s`}
      centerValueColor='#FCD116'
      centerValueSize={28}
      centerUnit='Total Cycle'
      centerUnitColor='#ffffff'
    />
  )
}

export default React.memo(TrafficCycleTrafficSignal)
