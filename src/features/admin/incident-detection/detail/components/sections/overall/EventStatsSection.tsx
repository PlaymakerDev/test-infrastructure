"use client"
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { TbCarCrash, TbHourglass } from 'react-icons/tb'
import {
  useIncidentTransactions,
  useIncidentPeakHour,
} from '@/hooks/queries/incident-detection'
import { getEventTypeLabel } from '@/features/admin/incident-detection/components/eventTypes'

// Overlay tint over a solid dark base — readable when floating over the map.
const CARD_BG = 'linear-gradient(#66AEFF1A, #66AEFF1A), #0e0e0e'

interface CardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sublabel: React.ReactNode
  /** Border + icon + label tint. */
  color: string
  /** When false, label stays white (matches Figma for the white-bordered card). */
  colorLabel?: boolean
}

// Card dimensions/typography mirror `InfoCardsTrafficVolume` exactly:
// p-3 / rounded-2xl / border 2px, icon fs-22, label fs-14 font-medium leading-none,
// value fs-22 font-bold leading-none (white), sublabel fs-12.
const Card: React.FC<CardProps> = ({ icon, label, value, sublabel, color, colorLabel = true }) => (
  <div className='rounded-2xl p-3' style={{ background: CARD_BG, border: `2px solid ${color}` }}>
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
    <p className='mb-0 font-bold leading-none fs-22' style={{ color: '#ffffff' }}>
      {value}
    </p>
    <p className='fs-12 mb-0 mt-1' style={{ color: '#9aa7b8' }}>
      {sublabel}
    </p>
  </div>
)

/** 2 compact summary cards (most-frequent event + peak hour) — overlay on map. */
const EventStatsSection: React.FC = () => {
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id

  // Today's transactions — summary gives counts per type.
  const today = dayjs().format('YYYY-MM-DD')
  const { data: tx } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: today,
    end_date: today,
    limit: 1,
  })

  // Peak hour for THIS solution (today) — backend-computed (label + %).
  const { data: peak } = useIncidentPeakHour(solutionId)

  // Card 1 — "เหตุการณ์เกิดขึ้นมากที่สุด"
  const topType = useMemo(() => {
    const items = tx?.summary?.type_details ?? []
    if (items.length === 0) return null
    const top = items.reduce((a, b) => (b.count > a.count ? b : a))
    if (top.count === 0) return null
    return {
      label: getEventTypeLabel(top.analytic_type, top.type_name_th),
      count: top.count,
    }
  }, [tx?.summary])

  // Card 2 — "ช่วงเวลาที่มีเหตุการณ์มากที่สุด" — solution-level, from the API.
  const peakHour = useMemo(() => {
    if (!peak || !peak.label || peak.count === 0) return null
    return { range: `${peak.label} น.`, pct: peak.percentage }
  }, [peak])

  return (
    <div className='flex flex-col gap-3 w-full'>
      <Card
        icon={<TbCarCrash />}
        label='เหตุการณ์เกิดขึ้นมากที่สุด'
        value={topType?.label ?? '—'}
        sublabel={topType ? `${topType.count.toLocaleString()} เหตุการณ์` : 'ยังไม่มีข้อมูล'}
        color='#ffffff'
        colorLabel={false}
      />
      <Card
        icon={<TbHourglass />}
        label='ช่วงเวลาที่มีเหตุการณ์มากที่สุด'
        value={peakHour?.range ?? '—'}
        sublabel={peakHour ? `(${peakHour.pct}%)` : 'ยังไม่มีข้อมูล'}
        color='#FFB100'
      />
    </div>
  )
}

export default React.memo(EventStatsSection)
