"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import PieChart from '@/components/chart/PieChart'
import { useDashboardCounting } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import type { DashboardCountingVehicleCount } from '@/types/dashboard/api'

// Vehicle types — order + color matches the Figma chart. The backend key
// (snake-cased) is mapped to the display label + the color swatch.
interface VehicleConfig {
  key: keyof Omit<DashboardCountingVehicleCount, 'total'>
  name: string
  color: string
}

const VEHICLES: VehicleConfig[] = [
  { key: 'car',     name: 'รถยนต์',         color: '#f87171' },
  { key: 'bike',    name: 'รถจักรยานยนต์',  color: '#34d399' },
  { key: 'pickup',  name: 'รถกระบะ',        color: '#60a5fa' },
  { key: 'truck',   name: 'รถบรรทุก',       color: '#7dd3fc' },
  { key: 'trailer', name: 'รถพ่วง',         color: '#fbbf24' },
  { key: 'taxi',    name: 'รถแท็กซี่',      color: '#a3e635' },
  { key: 'bus',     name: 'รถบัส',          color: '#c084fc' },
]

interface VehicleRow {
  name: string
  count: number
  pct: number
  color: string
}

interface Props {
  /** Extra utility classes for the outer card — e.g. "flex-1 min-h-0" to fill a flex parent */
  className?: string
}

const VehicleRatioChart: React.FC<Props> = ({ className = '' }) => {
  const deptId = useDeptId()
  const { data } = useDashboardCounting(deptId)

  // Map backend's keyed object → list in Figma order. Vehicles with 0 count
  // still render in the legend (greyed % = 0) so the layout stays stable.
  const rows = useMemo<VehicleRow[]>(() => {
    if (!data) return VEHICLES.map((v) => ({ name: v.name, count: 0, pct: 0, color: v.color }))
    return VEHICLES.map((v) => ({
      name: v.name,
      count: data.daily_vehicle_count[v.key]?.count ?? 0,
      pct: data.daily_vehicle_count[v.key]?.percentage ?? 0,
      color: v.color,
    }))
  }, [data])

  const total = data?.daily_vehicle_count.total?.count ?? rows.reduce((s, r) => s + r.count, 0)

  const pieData = useMemo(
    () => rows.map((r) => ({ name: r.name, value: r.count, color: r.color })),
    [rows]
  )

  return (
    <div
      className={`flex flex-col p-3 ${className}`}
      style={{
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {/* Title only — period tabs (วันนี้ / เดือน / ปี) intentionally hidden until
        * the API exposes range-scoped vehicle counts (current endpoint = today). */}
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-1.5 text-white text-sm font-medium'>
          <TbCar size={30} color='#FCD116' />
          สัดส่วนยานพาหนะ
        </div>
      </div>

      {/* Donut — reuses the shared PieChart (same as the traffic-volume detail
        * page) with its card chrome disabled so it nests cleanly inside this
        * card. `-mt-2` trims the empty header gap; the legend below is kept. */}
      <div className='flex items-center justify-center grow min-h-0 -mt-2'>
        <PieChart
          title=''
          icon={null}
          showGlow={false}
          iconCircle={false}
          cardBackground='transparent'
          cardBorderColor='transparent'
          data={pieData}
          centerLabel='ปริมาณจราจรทั้งหมด'
          centerValue={total.toLocaleString()}
          centerValueSize={28}
          centerUnit='คัน'
          donutSize={280}
          height={280}
          showLegend={false}
          tooltipUnit='คัน'
        />
      </div>

      <div className='px-14'>
        {rows.map((d) => (
          <div
            key={d.name}
            className='flex items-center text-sm'
            style={{ paddingTop: 5, paddingBottom: 5 }}
          >
            <div
              className='size-2.5 rounded-full shrink-0 mr-2'
              style={{ background: d.color }}
            />
            <span className='text-white'>{d.name}</span>
            <span className='flex-1' />
            <span className='text-white font-medium tabular-nums w-20 text-right'>
              {d.count.toLocaleString()}
            </span>
            <span className='text-white w-14 text-right tabular-nums'>{Math.round(d.pct)}%</span>
          </div>
        ))}
        <div
          className='flex items-center text-sm border-t'
          style={{
            paddingTop: 5,
            paddingBottom: 5,
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <div className='size-2.5 shrink-0 mr-2' />
          <span className='text-(--yellow) font-semibold'>รวม</span>
          <span className='flex-1' />
          <span className='text-(--yellow) font-bold tabular-nums w-20 text-right'>
            {total.toLocaleString()}
          </span>
          <span className='w-14' />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(VehicleRatioChart)
