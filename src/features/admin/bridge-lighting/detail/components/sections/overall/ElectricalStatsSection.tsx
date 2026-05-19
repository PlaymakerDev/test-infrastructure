"use client"
import React from 'react'
import { TbBolt } from 'react-icons/tb'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface CardProps {
  variant: 'voltage' | 'current'
  label: string
  /** Primary number shown in the card */
  value: number
  /** Unit symbol (V / A) */
  unit: string
  /** Sub-label above the number (e.g., "Avg." or "Total") */
  subLabel?: string
  /** When true, the card uses the larger summary style (bigger label/value) */
  isPrimary?: boolean
}

/** Single stat card — yellow border for voltage, blue for current.
 *  Layout: optional small label top-left, then big number + small unit. */
const StatCard: React.FC<CardProps> = ({
  variant,
  label,
  value,
  unit,
  subLabel,
  isPrimary,
}) => {
  const color = variant === 'voltage' ? '#FCD116' : '#66AEFF'
  return (
    <div
      className='flex flex-col gap-1 px-4 py-3'
      style={{
        borderRadius: 12,
        border: `2px solid ${color}`,
        background: '#66AEFF1A',
      }}
    >
      <div className='flex items-center gap-1.5'>
        {isPrimary && <TbBolt size={16} style={{ color }} />}
        <span className='text-xs font-semibold' style={{ color }}>
          {label}
        </span>
      </div>
      <div className='flex items-baseline gap-1.5'>
        {subLabel && (
          <span className='text-[11px]' style={{ color }}>
            {subLabel}
          </span>
        )}
        <span className='font-bold text-2xl tabular-nums text-white leading-none'>
          {value.toLocaleString(undefined, { minimumFractionDigits: value % 1 === 0 ? 0 : 1 })}
        </span>
        <span className='text-white/70 text-xs'>{unit}</span>
      </div>
    </div>
  )
}

interface Props {
  bridge: BridgeProject
}

/** Two rows of 4 cards each — Voltage (yellow) on top, Current (blue) below.
 *  Wrapped in an outer dark container (#191919CC) that frames the entire grid
 *  to match the Figma detail page top-right overlay. */
const ElectricalStatsSection: React.FC<Props> = ({ bridge }) => {
  const { voltage, current } = bridge

  return (
    <div
      className='flex flex-col gap-3 p-4'
      style={{
        borderRadius: 16,
        background: '#191919CC',
        backdropFilter: 'blur(5px)',
      }}
    >
      {/* ── Voltage row ── */}
      <div className='grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3'>
        <StatCard variant='voltage' label='Voltage' subLabel='Avg.' value={voltage.avg} unit='V' isPrimary />
        <StatCard variant='voltage' label='Phase 1' value={voltage.p1} unit='V' />
        <StatCard variant='voltage' label='Phase 2' value={voltage.p2} unit='V' />
        <StatCard variant='voltage' label='Phase 3' value={voltage.p3} unit='V' />
      </div>

      {/* ── Current row ── */}
      <div className='grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3'>
        <StatCard variant='current' label='Current' subLabel='Total' value={current.total} unit='A' isPrimary />
        <StatCard variant='current' label='Phase 1' value={current.p1} unit='A' />
        <StatCard variant='current' label='Phase 2' value={current.p2} unit='A' />
        <StatCard variant='current' label='Phase 3' value={current.p3} unit='A' />
      </div>
    </div>
  )
}

export default React.memo<Props>(ElectricalStatsSection)
