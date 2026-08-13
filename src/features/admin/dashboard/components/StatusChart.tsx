"use client"
import React, { useCallback, useMemo } from 'react'
import { TbCamera, TbMapPin, TbRoad } from 'react-icons/tb'
import {
  useDashboardCctvUptime,
  useDashboardPosition,
} from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import { useRoadId } from '@/hooks/useRoadId'

interface CardProps {
  icon: React.ReactNode
  /** `null` = still loading / fetch failed → renders '—' (never a fake 0). */
  value: number | null
  label: string
}

interface Props { }

/** 3 headline counters for the dashboard left rail.
 *  Data:
 *   - "กล้องทั้งหมด" = CCTV uptime totals (cctv-cameras-only — matches the
 *     overall page's hero numbers). Under a สายทาง scope it switches to CCTV
 *     install points from /position, since that endpoint ignores road_id.
 *   - "จุดติดตั้ง" = distinct solution rows in /manage/solution/{deptId}/position
 *     (every system, every install point).
 *   - "สายทาง"   = distinct road ids in the same position response. */
const StatusChart: React.FC<Props> = () => {
  const deptId = useDeptId()
  const roadId = useRoadId()
  const cctvQuery = useDashboardCctvUptime(deptId, roadId)
  // `roadId` → `&road_id=`, so จุดติดตั้ง / สายทาง count that road alone.
  const positionQuery = useDashboardPosition(deptId, roadId)
  const cctv = cctvQuery.data
  const position = positionQuery.data

  const stats = useMemo<CardProps[]>(() => {
    // Loading / error → `null` so the card shows '—' instead of a fake "0"
    // (the old version rendered 0/0/0 for the whole fetch window, 2026-08-13).
    const positionReady = !positionQuery.isLoading && !positionQuery.isError
    const cctvReady = !cctvQuery.isLoading && !cctvQuery.isError
    const locations = position?.locations ?? []
    // `/cctv/…/uptime-statistics` does NOT honour road_id (probed 2026-08-10 —
    // it keeps returning the dept's 941 cameras), so under a road scope the
    // camera figure is derived from the road-scoped position payload instead.
    // That counts CCTV *install points*, not cameras-per-solution — the same
    // basis RatioChart's tiles use, and it matches the pins on the map.
    const cameraTotal = roadId
      ? positionReady
        ? locations.filter((l) => l.solution?.solution_type_name === 'CCTV').length
        : null
      : cctvReady
        ? cctv?.camera.total ?? 0
        : null
    const installPoints = positionReady ? locations.length : null
    const roads = positionReady ? new Set(locations.map((l) => l.road.id)).size : null
    return [
      { icon: <TbCamera size={36} />, value: cameraTotal, label: 'กล้องทั้งหมด' },
      { icon: <TbMapPin size={36} />, value: installPoints, label: 'จุดติดตั้ง' },
      { icon: <TbRoad size={36} />, value: roads, label: 'สายทาง' },
    ]
  }, [cctv, position, roadId, cctvQuery.isLoading, cctvQuery.isError, positionQuery.isLoading, positionQuery.isError])

  const renderStatCard = useCallback((card: CardProps) => {
    const { icon, value, label } = card
    return (
      <div
        className='flex-1 flex flex-col items-center gap-3 py-5 px-4'
        style={{
          background: '#191919CC',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
        }}
      >
        <div
          className='flex items-center justify-center text-(--yellow)'
          style={{ width: 80, height: 80, background: '#212121', borderRadius: 10 }}
        >
          {icon}
        </div>
        <div className='text-3xl font-bold whitespace-nowrap tabular-nums' style={{ color: '#FCD116' }}>
          {value == null ? '—' : value.toLocaleString()}
        </div>
        <div className='fs-12' style={{ color: '#FCD116' }}>
          {label}
        </div>
      </div>
    )
  }, [])

  return (
    <div className='flex gap-3'>
      {stats.map((stat) => (
        <React.Fragment key={stat.label}>{renderStatCard(stat)}</React.Fragment>
      ))}
    </div>
  )
}

export default React.memo<Props>(StatusChart)
