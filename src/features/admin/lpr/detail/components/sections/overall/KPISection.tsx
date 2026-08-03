"use client"
import React from 'react'
import { TbBolt, TbCamera, TbLicense, TbGauge, TbMapPin } from 'react-icons/tb'
import { useLPRPointStats } from '@/hooks/queries/lpr'
import { useLPRDetailContext } from '../../../context'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  accent?: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color, accent }) => (
  // Flat tint only — the old blurred corner-glow read as a gradient fill;
  // removed per design 2026-07-20 ("สีปกติ ไม่ไล่สี").
  <div
    className='h-full rounded-2xl p-4 border-2 flex flex-col gap-1'
    style={{ borderColor: `${color}55`, background: `${color}12` }}
  >
    <div className='flex items-center gap-2' style={{ color }}>
      {icon}
      <span className='fs-13 font-semibold'>{label}</span>
    </div>
    <p className='mb-0 leading-none'>
      <span className='fs-24 font-bold tabular-nums text-white'>{value}</span>
    </p>
    <p className='fs-12 mb-0' style={{ color: accent ?? '#94a3b8' }}>
      {sub || ''}
    </p>
  </div>
)

/** Detail-page KPI row — pulls totals from /stats (authoritative day count
 *  incl. yesterday) and camera count from the /points cache (context). */
const KPISection: React.FC = () => {
  const { point, solutionId } = useLPRDetailContext()
  const { data: stats } = useLPRPointStats(solutionId)
  const fmt = (n: number) => n.toLocaleString('th-TH')

  const totalToday = stats?.total ?? 0
  const totalYest = stats?.total_yesterday ?? 0
  const eventsHour = point?.events_hour ?? 0
  const cameraCount = point?.camera_count ?? 0
  const avgSpeed = stats?.avg_speed ?? 0
  const topProvince = stats?.province_top?.[0]

  const delta = totalToday - totalYest
  const deltaPct = totalYest > 0 ? (delta / totalYest) * 100 : null
  const deltaSub =
    totalYest === 0
      ? 'ยังไม่มีข้อมูลเปรียบเทียบ'
      : delta >= 0
        ? `▲ +${fmt(delta)} (${deltaPct?.toFixed(1)}%) จากเมื่อวาน`
        : `▼ ${fmt(delta)} (${deltaPct?.toFixed(1)}%) จากเมื่อวาน`
  const deltaColor = totalYest === 0 ? '#94a3b8' : delta >= 0 ? '#4ade80' : '#f87171'

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
      <StatCard
        icon={<TbLicense size={20} />}
        label='ตรวจจับวันนี้'
        value={fmt(totalToday)}
        sub={deltaSub}
        accent={deltaColor}
        color='#FCD116'
      />
      <StatCard
        icon={<TbBolt size={20} />}
        label='ชั่วโมงล่าสุด'
        value={fmt(eventsHour)}
        sub={eventsHour > 0 ? 'Active' : 'Idle'}
        color='#66AEFF'
      />
      <StatCard
        icon={<TbCamera size={20} />}
        label='กล้อง LPR'
        value={fmt(cameraCount)}
        sub='ในจุดติดตั้งนี้'
        color='#05F2DB'
      />
      {/* 4th tile is context-sensitive: ANPR sites don't record speed, so
       *  fall back to "จังหวัดตรวจจับสูงสุด" (matches dmon's KPI #4). WIM sites
       *  keep the useful ความเร็วเฉลี่ย reading. */}
      {avgSpeed > 0 ? (
        <StatCard
          icon={<TbGauge size={20} />}
          label='ความเร็วเฉลี่ย'
          value={avgSpeed.toFixed(1)}
          sub='กม./ชม. · วันนี้'
          color='#B57BFF'
        />
      ) : (
        <StatCard
          icon={<TbMapPin size={20} />}
          label='จังหวัดตรวจจับสูงสุด'
          value={topProvince?.province || '—'}
          sub={
            topProvince
              ? `${fmt(topProvince.count)} ครั้ง · วันนี้`
              : 'ยังไม่มีข้อมูลวันนี้'
          }
          color='#B57BFF'
        />
      )}
    </div>
  )
}

export default React.memo(KPISection)
