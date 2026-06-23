"use client"
import React from 'react'
import { TbVideo, TbShield } from 'react-icons/tb'
import type { APIResponseCCTVOverviewTotals } from '@/types/cctv/overview-api'
import { fmtNumber } from '@/utils/formatNumber'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  sub?: string
  color: string
  tint?: string
}

const StatCard: React.FC<StatCardProps> = ({
  icon, label, value, unit, sub, color, tint,
}) => (
  <div
    className='flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 w-full xl:w-70 h-40 sm:h-44 xl:h-42.5'
    style={{
      borderRadius: 20,
      background: tint
        ? `linear-gradient(135deg, ${tint} 0%, rgba(0,0,0,0.55) 70%)`
        : 'rgba(0,0,0,0.55)',
      border: `2px solid ${color}`,
      backdropFilter: 'blur(5px)',
    }}
  >
    <div className='text-2xl sm:text-3xl xl:text-[40px]' style={{ color }}>
      {icon}
    </div>
    <p className='font-semibold text-xs sm:text-sm leading-tight' style={{ color }}>
      {label}
    </p>
    <div className='flex items-baseline gap-1.5 sm:gap-2'>
      <span className='font-bold text-3xl sm:text-4xl tabular-nums leading-none text-white'>
        {value.toLocaleString()}
      </span>
      <span className='text-white/70 text-[11px] sm:text-xs'>{unit}</span>
    </div>
    {sub && (
      <p className='text-white/50 text-[11px] sm:text-xs mt-auto'>{sub}</p>
    )}
  </div>
)

interface Props {
  totals: APIResponseCCTVOverviewTotals | null
}

const StatsSectionCctv: React.FC<Props> = ({ totals }) => {
  const camera = totals?.camera
  const warranty = totals?.warranty

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3'>
      <StatCard
        icon={<TbVideo />}
        label='กล้อง CCTV ในระบบทั้งหมด'
        value={camera?.total ?? 0}
        unit='ตัว'
        sub={
          camera
            ? `ออนไลน์ ${fmtNumber(camera.online, 0)} / ออฟไลน์ ${fmtNumber(camera.offline, 0)}`
            : undefined
        }
        color='#FCD116'
        tint='rgba(252,209,22,0.15)'
      />
      <StatCard
        icon={<TbShield />}
        label='ในค้ำ'
        value={warranty?.active ?? 0}
        unit='จุด'
        color='#05F2DB'
        tint='rgba(5,242,219,0.15)'
      />
      <StatCard
        icon={<TbShield />}
        label='หมดค้ำ'
        value={warranty?.expired ?? 0}
        unit='จุด'
        color='#979797'
      />
    </div>
  )
}

export default React.memo<Props>(StatsSectionCctv)
