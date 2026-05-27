"use client"
import React from 'react'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

interface Props { }

interface DailyCard {
  weekday: string
  date: string
  /** Phase values keyed by phase number — supports any number of phases. */
  values: Record<number, number>
  total: number
  peakPhase: number
}

const DAYS: DailyCard[] = [
  { weekday: 'วันศุกร์', date: '14 เม.ย. 2569', values: { 1: 3606, 2: 2398, 3: 3402, 4: 2586 }, total: 7491.25, peakPhase: 1 },
  { weekday: 'วันเสาร์', date: '15 เม.ย. 2569', values: { 1: 3606, 2: 3596, 3: 3802, 4: 1892 }, total: 8482.5, peakPhase: 3 },
  { weekday: 'วันอาทิตย์', date: '15 เม.ย. 2569', values: { 1: 4384, 2: 3506, 3: 3860, 4: 3946 }, total: 9784.5, peakPhase: 1 },
  { weekday: 'วันจันทร์', date: '16 เม.ย. 2569', values: { 1: 3723, 2: 3281, 3: 3943, 4: 1936 }, total: 7618.25, peakPhase: 3 },
  { weekday: 'วันอังคาร', date: '17 เม.ย. 2569', values: { 1: 3385, 2: 3173, 3: 2842, 4: 2732 }, total: 7144.25, peakPhase: 1 },
  { weekday: 'วันพุธ', date: '18 เม.ย. 2569', values: { 1: 3606, 2: 2398, 3: 3402, 4: 2586 }, total: 7491.25, peakPhase: 1 },
  { weekday: 'วันพฤหัสบดี', date: '19 เม.ย. 2569', values: { 1: 2017, 2: 1627, 3: 1402, 4: 1283 }, total: 3534.75, peakPhase: 1 },
]

/** Single horizontal phase bar — colored fill + numeric label. */
const PhaseBar: React.FC<{ phase: number; value: number; max: number }> = ({
  phase,
  value,
  max,
}) => {
  const pct = max > 0 ? (value / max) * 100 : 0
  const color = getPhaseColor(phase)
  return (
    <div className='flex items-center gap-2'>
      <span className='fs-12 font-bold w-7' style={{ color }}>
        P{phase}
      </span>
      <div
        className='flex-1 h-5 rounded overflow-hidden relative'
        style={{ background: '#1f2d3d' }}
      >
        <div
          className='h-full rounded'
          style={{ width: `${pct}%`, background: color }}
        />
        <span
          className='absolute inset-0 flex items-center justify-end pr-2 fs-12 font-semibold'
          style={{ color: '#000000' }}
        >
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

const DailyVolumeCardsSummaryTraffic: React.FC<Props> = () => {
  const { project } = useDetailContext()
  // 3-phase signal → render only P1–P3 bars per day. 4-phase → all four.
  const phaseNumbers = Array.from({ length: project.phase }, (_, i) => i + 1)

  return (
    // 7 cards fit the same parent width as the 4 chart cards above (gap-4 =
    // 16px matches the chart Row's `gutter={[16, 16]}`). Falls back to fewer
    // columns on narrower screens.
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4'>
      {DAYS.map((day, i) => {
        const max = Math.max(...phaseNumbers.map((p) => day.values[p] ?? 0))
        return (
          <div
            key={i}
            className='rounded-lg p-3 h-full'
            style={{ background: '#00000080', border: '1px solid #1f2d3d' }}
          >
            <div className='text-center mb-3'>
              <p className='fs-14 text-white font-semibold mb-0'>{day.weekday}</p>
              <p className='fs-12 text-gray-400 mb-0'>{day.date}</p>
            </div>
            <div className='flex flex-col gap-2'>
              {phaseNumbers.map((p) => (
                <PhaseBar key={p} phase={p} value={day.values[p] ?? 0} max={max} />
              ))}
            </div>
            <div className='mt-3 text-center fs-12'>
              <p className='mb-0 text-white'>
                Total : {day.total.toLocaleString()} PCU
              </p>
              <p className='mb-0' style={{ color: getPhaseColor(day.peakPhase) }}>
                Peak : Phase {day.peakPhase}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo<Props>(DailyVolumeCardsSummaryTraffic)
