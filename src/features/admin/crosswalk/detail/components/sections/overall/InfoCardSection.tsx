"use client"
import React from 'react'
import { Skeleton } from 'antd'
import dayjs from 'dayjs'
import { TbHandClick, TbTruck, TbUser, TbUserX } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import { useCrosswalkSummaryDaily } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'

interface Props {}

interface CardProps {
  icon: React.ReactNode
  label: string
  /** Border + label + icon tint. Use "white" for the un-tinted first card. */
  color: 'white' | 'blue' | 'red' | 'orange' | 'yellow' | 'lime'
  value: number
  unit: string
  isLoading?: boolean
}

// Hex per accent — border + icon + label tint. Matches Traffic Volume's card sizing.
const COLOR_HEX: Record<CardProps['color'], string> = {
  white: '#FFFFFF',
  blue: '#66AEFF',
  red: '#E94C4C',
  orange: '#FF7B00',
  yellow: '#FCD116',
  lime: '#B2FF00',
}

// Card dimensions/typography mirror `InfoCardsTrafficVolume` exactly:
// p-3 / rounded-2xl / border 2px, icon fs-22, label fs-14 font-medium leading-none,
// value fs-22 font-bold leading-none (white), unit fs-12.
const Card: React.FC<CardProps> = ({ icon, label, color, value, unit, isLoading }) => {
  const c = COLOR_HEX[color]
  const colorLabel = color !== 'white'
  return (
    <div
      className='p-3 rounded-2xl'
      style={{
        border: `2px solid ${c}`,
        background: 'linear-gradient(#66AEFF1A, #66AEFF1A), #191919',
      }}
    >
      <div className='flex items-center gap-2 mb-1'>
        <span style={{ color: c }} className='flex items-center fs-22 shrink-0'>
          {icon}
        </span>
        <span
          className='fs-14 font-medium leading-none'
          style={{ color: colorLabel ? c : '#ffffff' }}
        >
          {label}
        </span>
      </div>
      {isLoading ? (
        <Skeleton active paragraph={false} title={{ width: 120 }} />
      ) : (
        <p className='mb-0 font-bold leading-none fs-22' style={{ color: '#ffffff' }}>
          {fmtNumber(value, unit === 'km/h' ? 2 : 0)}{' '}
          <span className='fs-12 font-normal' style={{ color: '#979797' }}>
            {unit}
          </span>
        </p>
      )}
    </div>
  )
}

const InfoCardSection: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const { data, isLoading } = useCrosswalkSummaryDaily({
    solution_id: id,
    start_date: dayjs().format('YYYY-MM-DD'),
  })

  const crossing = data?.crossing
  const counting = data?.counting

  return (
    <div className='flex flex-col gap-3 w-full'>
      <Card
        icon={<TbUser />}
        label='คนข้ามทั้งหมด'
        color='white'
        value={crossing?.total ?? 0}
        unit='คน'
        isLoading={isLoading}
      />
      <Card
        icon={<TbHandClick />}
        label='การกดปุ่ม'
        color='blue'
        value={crossing?.button_pressed ?? 0}
        unit='ครั้ง'
        isLoading={isLoading}
      />
      <Card
        icon={<TbUserX />}
        label='คนข้ามฝ่าฝืนสัญญาณไฟ'
        color='red'
        value={crossing?.violation ?? 0}
        unit='คน'
        isLoading={isLoading}
      />
      <Card
        icon={<TbTruck />}
        label='รถข้ามฝ่าฝืนสัญญาณไฟ'
        color='orange'
        value={crossing?.red_light_violation ?? 0}
        unit='คัน'
        isLoading={isLoading}
      />
      <Card
        icon={<TbTruck />}
        label='ปริมาณจราจรประจำวัน'
        color='yellow'
        value={counting?.total_count ?? 0}
        unit='คัน'
        isLoading={isLoading}
      />
      <Card
        icon={<TbTruck />}
        label='ความเร็วเฉลี่ยประจำวัน'
        color='lime'
        value={counting?.avg_speed ?? 0}
        unit='km/h'
        isLoading={isLoading}
      />
    </div>
  )
}

export default React.memo<Props>(InfoCardSection)
