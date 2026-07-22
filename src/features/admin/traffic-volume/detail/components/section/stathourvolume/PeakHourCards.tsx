"use client"
import React, { useMemo } from 'react'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingHourBucket } from '@/types/traffic-volume/detail-api'
import { COUNT_FIELD_BY_TYPE, VEHICLE_TYPES } from './data/vehicleTypeKeys'

interface Props {
  date?: string
  /** Selected camera id ('all' / undefined = every camera). */
  cameraId?: string
}

/** Pick the vehicle type with the highest count for a given bucket. */
const dominantType = (b: CountingHourBucket) => {
  let best = VEHICLE_TYPES[0]
  let bestCount = b[COUNT_FIELD_BY_TYPE[best.key]] ?? 0
  for (const t of VEHICLE_TYPES) {
    const c = b[COUNT_FIELD_BY_TYPE[t.key]] ?? 0
    if (c > bestCount) {
      best = t
      bestCount = c
    }
  }
  const sharePct =
    b.total_count > 0 ? (bestCount / b.total_count) * 100 : 0
  return { type: best, count: bestCount, sharePct }
}

/** Top-5 hours by `total_count`. Each card shows the time, totals, and the
 *  dominant vehicle type for that hour. */
const PeakHourCards: React.FC<Props> = ({ date, cameraId }) => {
  const { id } = useDetailContext()
  const { data: apiData } = useTrafficVolumeCountHour({
    solution_id: id,
    date,
    camera_id: cameraId && cameraId !== 'all' ? cameraId : undefined,
  })

  const topHours = useMemo(() => {
    const buckets = apiData?.daily_count_hour ?? []
    return [...buckets]
      .sort((a, b) => b.total_count - a.total_count)
      .slice(0, 5)
  }, [apiData])

  return (
    <section>
      <p className='fs-13 text-(--yellow) mb-2'>
        ช่วงเวลาที่มีปริมาณจราจรสูงสุดประจำวัน
      </p>
      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3'>
        {topHours.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='rounded-2xl p-4 h-[96px]'
              style={{
                background: '#66AEFF1A',
                border: '1px solid #66AEFF',
              }}
            />
          ))
          : topHours.map((b) => {
            const hh = b.hour_timestamp.slice(11, 13)
            const dom = dominantType(b)
            return (
              <div
                key={hh}
                className='rounded-2xl py-3 px-4 text-center'
                style={{
                  background: '#66AEFF1A',
                  border: '1px solid #66AEFF',
                }}
              >
                <div
                  className='fs-16 font-semibold'
                  style={{ color: '#66AEFF' }}
                >
                  {hh}:00 น.
                </div>
                <div className='fs-14 mt-1' style={{ color: '#FFFFFF' }}>
                  {b.total_count.toLocaleString()} คัน{' '}
                  <span>
                    ({Math.round(b.total_pcu).toLocaleString()} PCU)
                  </span>
                </div>
                <div className='fs-12 mt-0.5' style={{ color: '#979797' }}>
                  {dom.type.label}{' '}
                  <span>{dom.count.toLocaleString()} คัน</span>{' '}
                  <span>({dom.sharePct.toFixed(1)}%)</span>
                </div>
              </div>
            )
          })}
      </div>
    </section>
  )
}

export default React.memo<Props>(PeakHourCards)
