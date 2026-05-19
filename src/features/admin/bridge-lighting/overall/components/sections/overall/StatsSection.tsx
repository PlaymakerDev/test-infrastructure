"use client"
import React, { useCallback } from 'react'
import { TbDeviceDesktop, TbShield } from 'react-icons/tb'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  active: number
  activePercent: number
  /** Border + icon + label + number accent color */
  color: string
  /**
   * Optional subtle tint inside the card (rgba string).
   * Pass undefined for a plain card without colored tint (e.g. the gray "หมดค้ำ" card).
   */
  tint?: string
}

const StatCard: React.FC<StatCardProps> = ({
  icon, label, value, unit, active, activePercent, color, tint,
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
    {/* Icon — top of card, accent color. Uses em-based size from parent
      * font-size so it scales with responsive text sizing. */}
    <div className='text-2xl sm:text-3xl xl:text-[40px]' style={{ color }}>
      {icon}
    </div>

    {/* Label — colored accent */}
    <p className='font-semibold text-xs sm:text-sm leading-tight' style={{ color }}>
      {label}
    </p>

    {/* Big number + unit inline */}
    <div className='flex items-baseline gap-1.5 sm:gap-2'>
      <span className='font-bold text-3xl sm:text-4xl tabular-nums leading-none text-white'>
        {value.toLocaleString()}
      </span>
      <span className='text-white/70 text-[11px] sm:text-xs'>{unit}</span>
    </div>

    {/* Active line */}
    <p className='text-white/50 text-[11px] sm:text-xs mt-auto'>
      Active : {active} ({activePercent.toFixed(1)}%)
    </p>
  </div>
)

interface Props {
  total?: number
  totalActive?: number
  inWarranty?: number
  inWarrantyActive?: number
  expired?: number
  expiredActive?: number
}

const StatsSection: React.FC<Props> = ({
  total = 12,
  totalActive = 10,
  inWarranty = 5,
  inWarrantyActive = 5,
  expired = 7,
  expiredActive = 5,
}) => {
  const pct = useCallback(
    (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100),
    []
  )

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3'>
      <StatCard
        icon={<TbDeviceDesktop />}
        label='ไฟประดับสะพานในระบบทั้งหมด'
        value={total}
        unit='จุดติดตั้ง'
        active={totalActive}
        activePercent={pct(totalActive, total)}
        color='#FCD116'
        tint='rgba(252,209,22,0.15)'
      />
      <StatCard
        icon={<TbShield />}
        label='ในค้ำ'
        value={inWarranty}
        unit='จุดติดตั้ง'
        active={inWarrantyActive}
        activePercent={pct(inWarrantyActive, inWarranty)}
        color='#05F2DB'
        tint='rgba(5,242,219,0.15)'
      />
      <StatCard
        icon={<TbShield />}
        label='หมดค้ำ'
        value={expired}
        unit='จุดติดตั้ง'
        active={expiredActive}
        activePercent={pct(expiredActive, expired)}
        color='#979797'
        // no tint — plain dark card per Figma
      />
    </div>
  )
}

export default React.memo<Props>(StatsSection)
