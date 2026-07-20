"use client"
import React, { useMemo } from 'react'
import {
  TbCar,
  TbTruck,
  TbGauge,
  TbClockHour4,
  TbCalendar,
  TbHourglassHigh,
} from 'react-icons/tb'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'
import {
  useTrafficVolumeCountHour,
  useTrafficVolumeSummaryDaily,
} from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'

interface CardProps {
  icon: React.ReactNode
  label: string
  /** Main value — rendered large. Always white per the volume design. */
  value: React.ReactNode
  /** Smaller accent unit shown right after the value (e.g. "PCU", "คัน/ชั่วโมง").
   *  Tinted with `color` so it matches the border. */
  unit?: React.ReactNode
  /** Smaller secondary line under the value, in muted gray. */
  sublabel?: React.ReactNode
  /** Border + label + unit tint. */
  color: string
  /** When true (default), label uses `color`. When false, label stays white
   *  (matches Figma for the white-bordered cards). */
  colorLabel?: boolean
}

/** Card primitive — same dimensions/padding/typography as `InfoCardsTrafficSignal`.
 *  The only intentional difference vs traffic-signal: value text is forced
 *  white per the volume design, with the unit suffix carrying the accent color. */
const Card: React.FC<CardProps> = ({
  icon,
  label,
  value,
  unit,
  sublabel,
  color,
  colorLabel = true,
}) => (
  <div
    className='p-3 rounded-2xl'
    style={{
      border: `2px solid ${color}`,
      background: 'linear-gradient(#66AEFF1A, #66AEFF1A), #191919',
    }}
  >
    <div className='flex items-center gap-2 mb-1'>
      <span style={{ color }} className='flex items-center fs-22 shrink-0'>
        {icon}
      </span>
      <span
        className='fs-14 font-medium leading-none'
        style={{ color: colorLabel ? color : '#ffffff' }}
      >
        {label}
      </span>
    </div>
    <p
      className='mb-0 font-bold leading-none fs-22'
      style={{ color: '#ffffff' }}
    >
      {value}
      {unit && (
        <>
          {' '}
          <span className='fs-12 font-normal' style={{ color: '#979797' }}>
            {unit}
          </span>
        </>
      )}
    </p>
    {sublabel && (
      <p className='fs-12 mb-0 mt-1' style={{ color: '#9aa7b8' }}>
        {sublabel}
      </p>
    )}
  </div>
)

// Per-card accent colors (border + label + unit), top→bottom per Figma:
// white → yellow → lime → green → teal → cyan.
const C_TOTAL = '#FFFFFF'
const C_PCU = '#F6FF00'
const C_AVG = '#C8FF00'
const C_SPEED = '#00FF00'
const C_AADT = '#00FFAA'
const C_PEAK = '#00DDFF'

/** Right-rail stat cards for the ภาพรวม tab.
 *  Data: `GET /counting/details/summary_daily?solution_id={id}`.
 *  The peak-hour card stays as a "-" placeholder until backend exposes it. */
const InfoCardsTrafficVolume: React.FC = () => {
  const { id } = useDetailContext()
  const { data } = useTrafficVolumeSummaryDaily({ solution_id: id })
  // Shares the cache with `LineChartHour` etc. — no extra request.
  const { data: hourData } = useTrafficVolumeCountHour({ solution_id: id })

  // Find the hour with the highest `total_count`. Format as
  // `HH:mm - HH+1:mm น.` with the percentage of the day total as sublabel.
  const peakHour = useMemo(() => {
    const buckets = hourData?.daily_count_hour ?? []
    if (buckets.length === 0) return null
    let best = buckets[0]
    for (const b of buckets) {
      if (b.total_count > best.total_count) best = b
    }
    // All-zero day — no meaningful peak; render placeholder.
    if (best.total_count === 0) return null
    const start = dayjs(best.hour_timestamp)
    const end = start.add(1, 'hour')
    const dayTotal =
      hourData?.daily_vehicle_count?.total.count ??
      buckets.reduce((s, b) => s + b.total_count, 0)
    const pct = dayTotal === 0 ? 0 : (best.total_count / dayTotal) * 100
    return {
      range: `${start.format('HH:mm')} - ${end.format('HH:mm')} น.`,
      pct,
    }
  }, [hourData])

  return (
    <div className='flex flex-col gap-3 w-full'>
      <Card
        icon={<TbCar />}
        label='รวมยานพาหนะประจำวัน'
        value={fmtNumber(data?.total_count ?? 0, 0)}
        unit='คัน'
        color={C_TOTAL}
        colorLabel={false}
      />
      <Card
        icon={<TbTruck />}
        label='PCU ประจำวัน'
        value={fmtNumber(data?.total_pcu ?? 0, 0)}
        unit='PCU'
        color={C_PCU}
      />
      <Card
        icon={<TbGauge />}
        label='ปริมาณจราจรเฉลี่ยรายชั่วโมง'
        value={fmtNumber(data?.avg_count_per_hour ?? 0, 0)}
        unit='คัน/ชั่วโมง'
        color={C_AVG}
      />
      <Card
        icon={<TbClockHour4 />}
        label='ความเร็วเฉลี่ยรายชั่วโมง'
        value={fmtNumber(data?.avg_speed ?? 0, 0)}
        unit='กิโลเมตร/ชั่วโมง'
        color={C_SPEED}
      />
      <Card
        icon={<TbCalendar />}
        label='AADT 7 วัน'
        value={fmtNumber(data?.aadt ?? 0, 0)}
        unit='คัน/วัน'
        color={C_AADT}
      />
      <Card
        icon={<TbHourglassHigh />}
        label='ช่วงเวลาปริมาณจราจรสูงสุด'
        value={peakHour?.range ?? '-'}
        sublabel={peakHour ? `(${fmtNumber(peakHour.pct, 1)}%)` : '(-)'}
        color={C_PEAK}
      />
    </div>
  )
}

export default React.memo(InfoCardsTrafficVolume)
