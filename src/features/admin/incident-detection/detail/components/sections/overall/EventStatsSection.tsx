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
    <div className='flex flex-col gap-3'>
      {/* เหตุการณ์เกิดขึ้นมากที่สุด */}
      <div
        className='rounded-2xl p-3'
        style={{ background: CARD_BG, border: '2px solid #ffffff' }}
      >
        <div className='flex items-center gap-1.5 mb-1'>
          <TbCarCrash size={24} className='shrink-0' style={{ color: '#ffffff' }} />
          <h4 className='mb-0 fs-14 font-semibold leading-tight' style={{ color: '#ffffff' }}>
            เหตุการณ์เกิดขึ้นมากที่สุด
          </h4>
        </div>
        <p className='font-semibold text-white leading-tight mb-0.5' style={{ fontSize: 22 }}>
          {topType?.label ?? '—'}
        </p>
        <p className='fs-11 text-gray-400 mb-0'>
          {topType ? `${topType.count.toLocaleString()} เหตุการณ์` : 'ยังไม่มีข้อมูล'}
        </p>
      </div>

      {/* ช่วงเวลาที่มีเหตุการณ์มากที่สุด */}
      <div
        className='rounded-2xl p-3'
        style={{ background: CARD_BG, border: '2px solid #FFB100' }}
      >
        <div className='flex items-center gap-1.5 mb-1'>
          <TbHourglass size={24} className='shrink-0' style={{ color: '#FFB100' }} />
          <h4 className='mb-0 fs-14 font-semibold leading-tight' style={{ color: '#FFB100' }}>
            ช่วงเวลาที่มีเหตุการณ์มากที่สุด
          </h4>
        </div>
        <p className='font-semibold text-white leading-tight mb-0.5' style={{ fontSize: 22 }}>
          {peakHour?.range ?? '—'}
        </p>
        <p className='fs-11 text-gray-400 mb-0'>
          {peakHour ? `(${peakHour.pct}%)` : 'ยังไม่มีข้อมูล'}
        </p>
      </div>
    </div>
  )
}

export default React.memo(EventStatsSection)
