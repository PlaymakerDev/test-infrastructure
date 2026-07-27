"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import dayjs from 'dayjs'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { thaiDateBE } from '@/utils/thaiDate'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingHourBucket } from '@/types/traffic-volume/detail-api'
import { VEHICLE_TYPES } from './data/vehicleTypes'

interface Props { }

/** Map our internal vehicle-type keys → the API's per-type `*_count` field
 *  on each hour bucket. Keeps the tooltip extras in lock-step with the
 *  shared `VEHICLE_TYPES` config (colors + labels). */
const COUNT_FIELD_BY_KEY: Record<
  string,
  Exclude<keyof CountingHourBucket, 'hour_timestamp' | 'total_count' | 'total_pcu'> | undefined
> = {
  motorcycle: 'bike_count',
  car: 'car_count',
  pickup: 'pickup_count',
  taxi: 'taxi_count',
  bus: 'bus_count',
  truck: 'truck_count',
  trailer: 'trailer_count',
}

const bucketToDataPoint = (b: CountingHourBucket): LineChartDataPoint => ({
  label: dayjs(b.hour_timestamp).format('HH.mm'),
  dateLabel: thaiDateBE(b.hour_timestamp),
  total: b.total_count,
  bike: b.bike_count,
  car: b.car_count,
  pickup: b.pickup_count,
  taxi: b.taxi_count,
  bus: b.bus_count,
  truck: b.truck_count,
  trailer: b.trailer_count,
})

const LineChartHour: React.FC<Props> = () => {
  const { id } = useDetailContext()
  // No `date` argument — let the backend default to today. A date-picker
  // can be wired up later by passing `date: dayjs().format('YYYY-MM-DD')`.
  const { data } = useTrafficVolumeCountHour({ solution_id: id })

  const hours = useMemo(
    () => (data?.daily_count_hour ?? []).map(bucketToDataPoint),
    [data]
  )

  // Tooltip rows — one per vehicle type, using the shared color palette so
  // the donut/legend/table on the same tab all match.
  const tooltipExtras = useMemo(
    () =>
      VEHICLE_TYPES.map((t) => ({
        dataKey: COUNT_FIELD_BY_KEY[t.key]?.replace('_count', '') ?? t.key,
        label: t.label,
        color: t.color,
        unit: 'คัน',
      })),
    []
  )

  return (
    <LineChart
      title='ปริมาณจราจรรายชั่วโมง'
      icon={<TbCar size={22} />}
      iconCircle={false}
      showGlow={false}
      data={hours}
      lines={[
        { dataKey: 'total', color: '#66AEFF', label: 'รวมทั้งหมด', unit: 'คัน' },
      ]}
      // Fixed height (not `fillHeight`) so this card matches the 7-day bar
      // chart below it exactly — same chart height + same header ⇒ equal cards.
      height={260}
      tooltipDateKey='dateLabel'
      tooltipExtras={tooltipExtras}
    // โชว์ทุกชั่วโมง 00.00–23.00 ไม่เว้น — หมุน 45° ให้ label ไม่ทับกัน
    // xAxisLabelInterval={0}
    // xAxisLabelRotate={45}
    />
  )
}

export default React.memo<Props>(LineChartHour)
