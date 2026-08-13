"use client"
import React, { useMemo } from 'react'
import { Skeleton } from 'antd'
import { TbCar } from 'react-icons/tb'
import PieChart from '@/components/chart/PieChart'
import { useDashboardCounting } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import { useRoadId } from '@/hooks/useRoadId'
import { VEHICLE_TYPE_COLOR } from '@/constants/vehicle'
import type { DashboardCountingVehicleCount } from '@/types/dashboard/api'

// Vehicle types — the backend key (snake-cased) mapped to the display label.
// Colours come from the shared `VEHICLE_TYPE_COLOR` map (blue → orange, light
// → heavy) so a vehicle type is the SAME colour here as on the Traffic Volume
// detail page's สัดส่วนยานพาหนะ card (2026-08-10 request; the old palette was
// raw Tailwind defaults unrelated to any other chart).
interface VehicleConfig {
  key: keyof Omit<DashboardCountingVehicleCount, 'total'>
  name: string
  color: string
}

const VEHICLES: VehicleConfig[] = [
  { key: 'car', name: 'รถยนต์', color: VEHICLE_TYPE_COLOR['รถยนต์'] },
  { key: 'bike', name: 'รถจักรยานยนต์', color: VEHICLE_TYPE_COLOR['รถจักรยานยนต์'] },
  { key: 'pickup', name: 'รถกระบะ', color: VEHICLE_TYPE_COLOR['รถกระบะ'] },
  { key: 'truck', name: 'รถบรรทุก', color: VEHICLE_TYPE_COLOR['รถบรรทุก'] },
  { key: 'trailer', name: 'รถพ่วง', color: VEHICLE_TYPE_COLOR['รถพ่วง'] },
  { key: 'taxi', name: 'รถแท็กซี่', color: VEHICLE_TYPE_COLOR['รถแท็กซี่'] },
  { key: 'bus', name: 'รถบัส', color: VEHICLE_TYPE_COLOR['รถบัส'] },
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
  const roadId = useRoadId()
  const { data, isLoading, isError } = useDashboardCounting(deptId, roadId)

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
      {/* Title only — this card is DAILY BY DESIGN (product decision
        * 2026-08-13): it always shows today's vehicle mix and deliberately
        * ignores the วันนี้/เดือน/ปี tab. Not waiting on any BE range param —
        * do not re-flag as pending. */}
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-1.5 text-white fs-12 font-medium'>
          <TbCar size={30} color='#FCD116' />
          สัดส่วนยานพาหนะ
        </div>
      </div>

      {/* Loading / error — the old version rendered a real-looking all-zero
        * donut with "0 คัน" in the center for the whole fetch window,
        * indistinguishable from a genuine zero-traffic day (fixed 2026-08-13). */}
      {isLoading ? (
        <div className='grow min-h-0 flex items-center justify-center py-10'>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : isError ? (
        <div className='grow min-h-0 flex items-center justify-center py-10'>
          <span className='fs-12 text-white/50'>โหลดข้อมูลไม่สำเร็จ</span>
        </div>
      ) : (
      <>
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
          // 240 (was 280) — gives back the 40px the right rail lost on
          // 2026-08-10: the Notification card grew 20px taller and the rail
          // itself moved 20px down (top 64 → 84) for navbar breathing room.
          // Keeps the whole rail inside the viewport without scrolling.
          donutSize={240}
          height={240}
          showLegend={false}
          tooltipUnit='คัน'
        />
      </div>

      {/* px-6 (not px-14) — at the 340px right rail the fatter padding left too
        * little row width and Thai labels wrapped to two lines. */}
      <div className='px-6'>
        {rows.map((d) => (
          <div
            key={d.name}
            className='flex items-center fs-12'
            style={{ paddingTop: 5, paddingBottom: 5 }}
          >
            <div
              className='size-2.5 rounded-full shrink-0 mr-2'
              style={{ background: d.color }}
            />
            <span className='text-white whitespace-nowrap'>{d.name}</span>
            <span className='flex-1' />
            <span className='text-white font-medium tabular-nums w-20 text-right'>
              {d.count.toLocaleString()}
            </span>
            <span className='text-white w-14 text-right tabular-nums'>{Math.round(d.pct)}%</span>
          </div>
        ))}
        <div
          className='flex items-center fs-12 border-t'
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
      </>
      )}
    </div>
  )
}

export default React.memo<Props>(VehicleRatioChart)
