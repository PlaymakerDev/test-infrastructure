"use client"
import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficSummary } from '@/hooks/queries/traffic-signal'
import { thaiDayName } from '@/utils/formatDate'
import { useDetailContext } from '../../../context'

interface Props {
  /** End date of the 7-day window (YYYY-MM-DD). Backend returns 7 entries
   *  ending at this date. */
  endDate: string
}

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
      <div className='flex-1 h-5 rounded relative' style={{ background: '#1f2d3d' }}>
        {/* Number lives INSIDE the colored fill, right-aligned — so it sits at
         *  the right end of the bar (per Figma), not at the far right of the
         *  track. `minWidth: min-content` keeps the label readable when the
         *  fill would otherwise be too narrow to hold it. */}
        <div
          className='h-full rounded flex items-center justify-end px-2 fs-12 font-semibold whitespace-nowrap'
          style={{ width: `${pct}%`, minWidth: 'min-content', background: color, color: '#000000' }}
        >
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

const DailyVolumeCardsSummaryTraffic: React.FC<Props> = ({ endDate }) => {
  const { project } = useDetailContext()
  const { data } = useTrafficSummary(project.id, { date: endDate })

  const phaseNumbers = useMemo(
    () => Array.from({ length: project.phase }, (_, i) => i + 1),
    [project.phase]
  )

  const days = useMemo(() => {
    return (data ?? []).map((d) => {
      // Map phases array to a {phase_no: pcu} lookup
      const values: Record<number, number> = {}
      for (const p of d.phases) {
        values[p.phase_no] = p.pcu
      }
      const date = dayjs(d.date).locale('th')
      return {
        weekday: `วัน${thaiDayName(d.day)}`,
        date: date.format('D MMM BBBB').replace(/(\d+)/, (s) => s),
        values,
        total: d.total_pcu,
        peakPhase: d.peak_phase,
      }
    })
  }, [data])

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4'>
      {days.map((day, i) => {
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
