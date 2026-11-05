"use client"
import React from 'react'
import {
  TbTrafficLights,
  TbShieldCheckFilled,
  TbTruck,
  TbWaveSine,
} from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
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
    className='p-3 rounded-2xl'
    style={{
      border: `2px solid ${color}`,
      background: 'linear-gradient(#66AEFF1A, #66AEFF1A), #191919',
    }}
  >
    <div className='flex items-center gap-2 mb-1'>
      <span style={{ color }} className='flex items-center fs-22 shrink-0'>
        {icon}
      </span>
      <span
        className='fs-14 font-medium leading-none'
        style={{ color: colorLabel ? color : '#ffffff' }}
      >
        {label}
      </span>
    </div>
    <p
      className='mb-0 font-bold leading-none fs-22'
      style={{ color }}
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
        // An unconfigured junction reports `controller_mode: ""` and
        // `total_phases: 0` — the card used to render a blank value and claim
        // "0 Phase" even where live PCU data exists (solution 1611 reports
        // phases 2–4). Show a dash instead of asserting either (2026-10-26).
        value={project.operatingMode || '-'}
        sublabel={project.phase > 0 ? `${project.phase} Phase` : undefined}
        color='#ffffff'
        colorLabel={false}
      />
      <Card
        icon={<TbShieldCheckFilled />}
        label='ประสิทธิภาพของระบบ'
        value={`${fmtNumber(project.efficiency, 1)}%`}
        color='#FCD116'
      />
      <Card
        icon={<TbTruck />}
        label='PCU ประจำวัน'
        value={
          <>
            {fmtNumber(project.dailyPCU, 0)}{' '}
            <span className='fs-12 font-normal' style={{ color: '#9aa7b8' }}>PCU</span>
          </>
        }
        color='#B5FF3B'
      />
      <Card
        icon={<TbWaveSine />}
        label='การจราจรช่วงเวลาเร่งด่วน'
        value={
          <>
            {fmtNumber(project.peakHourTraffic, 0)}{' '}
            <span className='fs-12 font-normal' style={{ color: '#9aa7b8' }}>คัน</span>
          </>
        }
        // `max_active_phase` is 0 — not null — on every junction without a
        // peak yet (82 of 146, 2026-10-26), so `?? '-'` never fired and the
        // card claimed "Phase 0 : Peak". Same dash rule as the mode card.
        sublabel={`Phase ${project.peakPhase || '-'} : Peak`}
        color='#7CFC00'
      />
    </div>
  )
}

export default React.memo(InfoCardsTrafficSignal)
