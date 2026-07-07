"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import PieChart from '@/components/chart/PieChart'
import { fmtNumber } from '@/utils/formatNumber'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingDailyVehicleCount } from '@/types/traffic-volume/detail-api'
import { VEHICLE_TYPES } from './data/vehicleTypes'

interface Props { }

/** Internal type key → API field key. Same mapping the breakdown table uses
 *  so both views stay in sync — the API uses `bike` for motorcycles while
 *  our internal config uses `motorcycle`; everything else lines up. */
const API_KEY_BY_TYPE_KEY: Record<string, keyof CountingDailyVehicleCount> = {
  motorcycle: 'bike',
  car: 'car',
  pickup: 'pickup',
  taxi: 'taxi',
  bus: 'bus',
  truck: 'truck',
  trailer: 'trailer',
}

const VehicleProportionChart: React.FC<Props> = () => {
  const { id } = useDetailContext()
  // Shares the React Query cache with `LineChartHour` + `VehicleBreakdownTable`
  // — only one network request per page load.
  const { data, isLoading } = useTrafficVolumeCountHour({ solution_id: id })
  const breakdown = data?.daily_vehicle_count

  const rows = useMemo(() => {
    return VEHICLE_TYPES.map((t) => {
      const apiKey = API_KEY_BY_TYPE_KEY[t.key]
      const stat = (apiKey && breakdown?.[apiKey]) || undefined
      return {
        ...t,
        count: stat?.count ?? 0,
        pct: stat?.percentage ?? 0,
      }
    })
  }, [breakdown])

  // `total.count` from the API is the authoritative day total; falls back
  // to summing the rows if the response hasn't resolved yet.
  const total = useMemo(
    () => breakdown?.total.count ?? rows.reduce((s, r) => s + r.count, 0),
    [breakdown, rows]
  )

  const pieData = useMemo(
    () =>
      rows.map((r) => ({
        name: r.label,
        // ECharts pie collapses 0-value segments — substitute a tiny epsilon
        // when the whole day's counts are zero so the donut still renders.
        value: r.count,
        color: r.color,
      })),
    [rows]
  )

  const dim = isLoading ? 'opacity-50' : ''

  return (
    <div
      className={`py-3 px-5 rounded-[14px] h-full flex flex-col ${dim}`}
      style={{
        border: `1.5px solid #1f2d3d`,
        background: '#191919',
      }}
    >
      <div className='flex items-center gap-2 mb-2'>
        <TbCar size={22} className='text-(--yellow)' />
        <span className='fs-14 font-normal text-(--yellow)'>สัดส่วนยานพาหนะ</span>
      </div>

      {/* Donut — uses the central PieChart but with its card chrome disabled
        * so it nests cleanly inside our outer card. Negative `-mt-4` pulls
        * the donut up against the section title. */}
      <div className='-mt-6'>
        <PieChart
          title=''
          icon={null}
          showGlow={false}
          iconCircle={false}
          cardBackground='transparent'
          cardBorderColor='transparent'
          data={pieData}
          centerLabel='ปริมาณจราจรทั้งหมด'
          centerValue={fmtNumber(total, 0)}
          centerUnit='คัน'
          height={280}
          donutSize={280}
          showLegend={false}
          tooltipUnit='คัน'
        />
      </div>

      {/* Legend list — name · count · percentage. Uses API-provided
        * `percentage` so legend numbers match the breakdown table exactly. */}
      <div className='mt-3 flex flex-col gap-1.5'>
        {rows.map((r) => (
          <div
            key={r.key}
            className='flex items-center justify-between gap-2 fs-12'
          >
            <div className='flex items-center gap-2 min-w-0'>
              <span
                className='inline-block w-2 h-2 rounded-full shrink-0'
                style={{ background: r.color }}
              />
              <span className='text-white/80 truncate'>{r.label}</span>
            </div>
            <div className='flex items-center gap-4 shrink-0 text-white/80'>
              <span className='tabular-nums'>{fmtNumber(r.count, 0)}</span>
              <span className='tabular-nums text-white/60 w-12 text-right'>
                {fmtNumber(r.pct, 1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo<Props>(VehicleProportionChart)
