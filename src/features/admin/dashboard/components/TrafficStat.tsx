"use client"
import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { TbClock } from 'react-icons/tb'
import { useDashboardCounting } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** "ช่วงเวลาปริมาณการจราจรสูงสุดวันนี้" — pulls the hourly bucket with the
 *  highest `total_count` from /counting/{deptId}/dashboard.daily_count_hour. */
const TrafficStat: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data } = useDashboardCounting(deptId)

  const peak = useMemo(() => {
    const hours = data?.daily_count_hour ?? []
    if (hours.length === 0) return null
    const top = hours.reduce((a, b) => (b.total_count > a.total_count ? b : a))
    if (top.total_count === 0) return null
    return top
  }, [data])

  const hourLabel = peak ? dayjs(peak.hour_timestamp).format('HH:mm') : '—'
  const vehicles = peak?.total_count ?? 0
  const pcu = peak ? Math.round(peak.total_pcu) : 0

  return (
    <div
      className='p-4'
      style={{
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div className='flex items-center gap-2 mb-3'>
        <TbClock size={30} color='#FCD116' />
        <span className='text-sm font-medium' style={{ color: '#FCD116' }}>
          ช่วงเวลาปริมาณการจราจรสูงสุดวันนี้
        </span>
      </div>
      <div
        className='mb-3'
        style={{
          height: 1,
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(252,209,22,0.4) 0, rgba(252,209,22,0.4) 6px, transparent 6px, transparent 14px)',
        }}
      />
      <div className='grid grid-cols-3 gap-1'>
        <span className='text-[14px]' style={{ color: '#6b7f9a' }}>ช่วงเวลา</span>
        <span className='text-[14px] text-center' style={{ color: '#6b7f9a' }}>คัน</span>
        <span className='text-[14px] text-right' style={{ color: '#6b7f9a' }}>PCU</span>
        <span className='text-[14px] font-medium mt-1 tabular-nums text-white'>{hourLabel}</span>
        <span className='text-[14px] font-medium mt-1 text-center tabular-nums text-white'>
          {vehicles.toLocaleString()}
        </span>
        <span className='text-[14px] font-medium mt-1 text-right tabular-nums text-white'>
          {pcu.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default React.memo<Props>(TrafficStat)
