"use client"
import React, { useMemo } from 'react'
import { TbShare } from 'react-icons/tb'
import BarChart, {
  type BarChartDataPoint,
  type BarConfig,
} from '@/components/chart/Barchart'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import { VEHICLE_TYPES } from './data/vehicleTypeKeys'

interface Props {
  /** YYYY-MM-DD — propagated from the tab-level FilterBar. */
  date?: string
}

/** Build a 24-row dataset (00:00 → 23:00), one column per hour, with per-
 *  vehicle-type counts as separate keys. */
const StackedHourlyBarChart: React.FC<Props> = ({ date }) => {
  const { id } = useDetailContext()
  const { data: apiData } = useTrafficVolumeCountHour({
    solution_id: id,
    date,
  })

  const data = useMemo<BarChartDataPoint[]>(() => {
    const byHour = new Map<string, BarChartDataPoint>()
    for (const p of apiData?.daily_count_hour ?? []) {
      const hh = p.hour_timestamp.slice(11, 13)
      byHour.set(hh, {
        label: `${hh}:00`,
        motorcycle: p.bike_count,
        car: p.car_count,
        pickup: p.pickup_count,
        taxi: p.taxi_count,
        bus: p.bus_count,
        truck: p.truck_count,
        trailer: p.trailer_count,
      })
    }
    // Pad every hour so the X-axis always reads 00:00 → 23:00 even when the
    // backend hasn't reported the later hours yet.
    return Array.from({ length: 24 }, (_, h) => {
      const hh = h.toString().padStart(2, '0')
      return byHour.get(hh) ?? { label: `${hh}:00` }
    })
  }, [apiData])

  /** Bar series — one per vehicle type, all stacked. */
  const bars = useMemo<BarConfig[]>(
    () =>
      VEHICLE_TYPES.map((t) => ({
        dataKey: t.key,
        color: t.color,
        label: t.label,
      })),
    []
  )

  return (
    <BarChart
      title='แยกประเภทยานพาหนะรายชั่วโมง'
      icon={<TbShare size={22} />}
      iconCircle={false}
      data={data}
      bars={bars}
      stacked
      tooltipShowPercent
      tooltipUnit='คัน'
      height={320}
      cardBackground='#000000CC'
      cardBorderColor='transparent'
      footer={
        <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-2'>
          {VEHICLE_TYPES.map((t) => (
            <span
              key={t.key}
              className='inline-flex items-center gap-1.5 fs-12 text-white/75'
            >
              <span
                className='inline-block w-2 h-2 rounded-full'
                style={{ background: t.color }}
              />
              {t.label}
            </span>
          ))}
        </div>
      }
    />
  )
}

export default React.memo<Props>(StackedHourlyBarChart)
