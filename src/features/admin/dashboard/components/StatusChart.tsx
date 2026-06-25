"use client"
import React, { useCallback, useMemo } from 'react'
import { TbCamera, TbMapPin, TbRoad } from 'react-icons/tb'
import {
  useDashboardCctvUptime,
  useDashboardPosition,
} from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'

interface CardProps {
  icon: React.ReactNode
  value: number
  label: string
}

interface Props {}

/** 3 headline counters for the dashboard left rail.
 *  Data:
 *   - "กล้องทั้งหมด" = CCTV uptime totals (cctv-cameras-only — matches the
 *     overall page's hero numbers).
 *   - "จุดติดตั้ง" = distinct solution rows in /manage/solution/{deptId}/position
 *     (every system, every install point).
 *   - "สายทาง"   = distinct road ids in the same position response. */
const StatusChart: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data: cctv } = useDashboardCctvUptime(deptId)
  const { data: position } = useDashboardPosition(deptId)

  const stats = useMemo<CardProps[]>(() => {
    const cameraTotal = cctv?.camera.total ?? 0
    const locations = position?.locations ?? []
    const installPoints = locations.length
    const roads = new Set(locations.map((l) => l.road.id)).size
    return [
      { icon: <TbCamera size={36} />, value: cameraTotal, label: 'กล้องทั้งหมด' },
      { icon: <TbMapPin size={36} />, value: installPoints, label: 'จุดติดตั้ง' },
      { icon: <TbRoad size={36} />, value: roads, label: 'สายทาง' },
    ]
  }, [cctv, position])

  const renderStatCard = useCallback((card: CardProps) => {
    const { icon, value, label } = card
    return (
      <div
        className='flex-1 flex flex-col items-center gap-3 py-5 px-3'
        style={{
          background: 'rgba(184,205,181,0.2)',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
        }}
      >
        <div
          className='flex items-center justify-center text-(--yellow)'
          style={{ width: 80, height: 80, background: '#191919', borderRadius: 10 }}
        >
          {icon}
        </div>
        <div className='text-3xl font-bold' style={{ color: '#FCD116' }}>
          {value.toLocaleString()}
        </div>
        <div className='text-sm' style={{ color: '#FCD116' }}>
          {label}
        </div>
      </div>
    )
  }, [])

  return (
    <div className='flex gap-2'>
      {stats.map((stat) => (
        <React.Fragment key={stat.label}>{renderStatCard(stat)}</React.Fragment>
      ))}
    </div>
  )
}

export default React.memo<Props>(StatusChart)
