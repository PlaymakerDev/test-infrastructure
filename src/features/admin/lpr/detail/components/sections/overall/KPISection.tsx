"use client"
import React from 'react'
import { TbBolt, TbCamera, TbLicense, TbClock } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, hint, color }) => (
  <div
    className='h-full rounded-2xl p-4 border-2 flex flex-col gap-1'
    style={{ borderColor: color, background: `${color}1A` }}
  >
    <div className='flex items-center gap-2' style={{ color }}>
      {icon}
      <span className='fs-13 font-semibold'>{label}</span>
    </div>
    <p className='mb-0 leading-none'>
      <span className='fs-24 font-bold tabular-nums text-white'>{value}</span>
    </p>
    {hint && <p className='fs-11 text-gray-400 mb-0'>{hint}</p>}
  </div>
)

/** Four-tile KPI row for the LPR detail page — same visual family as the
 *  overall page's InfoCardSection, only per-install-point instead of
 *  totals. Sources numbers from the useLPRPoints cache (via context). */
const KPISection: React.FC = () => {
  const { point } = useLPRDetailContext()
  const fmt = (n: number) => n.toLocaleString('th-TH')

  const eventsToday = point?.events_today ?? 0
  const eventsHour = point?.events_hour ?? 0
  const cameraCount = point?.camera_count ?? 0
  const isActive = eventsHour > 0

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
      <StatCard
        icon={<TbLicense size={20} />}
        label='ตรวจจับวันนี้'
        value={fmt(eventsToday)}
        hint='ครั้ง'
        color='#FCD116'
      />
      <StatCard
        icon={<TbBolt size={20} />}
        label='ชั่วโมงล่าสุด'
        value={fmt(eventsHour)}
        hint={isActive ? 'Active' : 'Idle'}
        color='#66AEFF'
      />
      <StatCard
        icon={<TbCamera size={20} />}
        label='กล้อง LPR'
        value={fmt(cameraCount)}
        hint='ตัว'
        color='#05F2DB'
      />
      <StatCard
        icon={<TbClock size={20} />}
        label='อัตราต่อชั่วโมง'
        value={fmt(Math.round(eventsToday / Math.max(1, new Date().getHours() || 1)))}
        hint='เฉลี่ยครั้ง / ชั่วโมง'
        color='#B57BFF'
      />
    </div>
  )
}

export default React.memo(KPISection)
