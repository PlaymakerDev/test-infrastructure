"use client"
import React from 'react'
import {
  TbTrafficLights,
  TbShieldCheckFilled,
  TbTruck,
  TbWaveSine,
} from 'react-icons/tb'
import { useDetailContext } from '../../../context'

interface CardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sublabel?: React.ReactNode
  /** Border + label + value tint. Card 1 uses white; the rest use their accent. */
  color: string
  /** When true, label uses `color`. Otherwise label stays white (matches
   *  Figma where some cards have white label + colored value). */
  colorLabel?: boolean
}

const Card: React.FC<CardProps> = ({ icon, label, value, sublabel, color, colorLabel = true }) => (
  <div
    className='py-3 px-5 rounded-[14px]'
    style={{
      border: `1.5px solid ${color}`,
      background:
        'linear-gradient(135deg, rgba(20,28,48,0.85) 0%, rgba(10,18,36,0.95) 100%)',
    }}
  >
    <div className='flex items-center gap-2 mb-1'>
      <span style={{ color }} className='flex items-center text-[22px] shrink-0'>
        {icon}
      </span>
      <span
        className='fs-14'
        style={{ color: colorLabel ? color : '#ffffff', fontWeight: 500 }}
      >
        {label}
      </span>
    </div>
    <p
      className='mb-0 font-bold leading-none'
      style={{ color, fontSize: 26 }}
    >
      {value}
    </p>
    {sublabel && (
      <p className='fs-12 mb-0 mt-1' style={{ color: '#9aa7b8' }}>
        {sublabel}
      </p>
    )}
  </div>
)

const InfoCardsTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  return (
    <div className='flex flex-col gap-3 w-full'>
      <Card
        icon={<TbTrafficLights />}
        label='โหมดการทำงานแยกจราจร'
        value={project.operatingMode}
        sublabel={`${project.phase} Phase`}
        color='#ffffff'
        colorLabel={false}
      />
      <Card
        icon={<TbShieldCheckFilled />}
        label='ประสิทธิภาพของระบบ'
        value={`${(project.efficiency ?? 0).toFixed(1)}%`}
        color='#FCD116'
      />
      <Card
        icon={<TbTruck />}
        label='PCU ประจำวัน'
        value={
          <>
            {(project.dailyPCU ?? 0).toLocaleString()}{' '}
            <span className='fs-14 font-normal'>PCU</span>
          </>
        }
        color='#B5FF3B'
      />
      <Card
        icon={<TbWaveSine />}
        label='การจราจรช่วงเวลาเร่งด่วน'
        value={
          <>
            {(project.peakHourTraffic ?? 0).toLocaleString()}{' '}
            <span className='fs-14 font-normal'>คัน</span>
          </>
        }
        sublabel={`Phase ${project.peakPhase ?? '-'} : Peak`}
        color='#7CFC00'
      />
    </div>
  )
}

export default React.memo(InfoCardsTrafficSignal)
