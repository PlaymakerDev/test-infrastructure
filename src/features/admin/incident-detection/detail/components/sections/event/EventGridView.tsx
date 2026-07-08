"use client"
import React from 'react'
import { TbPhotoOff } from 'react-icons/tb'
import dayjs from 'dayjs'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import { thaiDateBE } from '@/utils/thaiDate'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'

// ── Date helpers (shared by table + grid) ────────────────────────────────────

/** ISO date_time → Buddhist-era date "6 ก.ค. 2569". */
export const fmtThaiDate = (iso: string): string => {
  const d = dayjs(iso)
  return d.isValid() ? thaiDateBE(iso) : iso
}

/** ISO date_time → "15:47:03". */
export const fmtTime = (iso: string): string => {
  const d = dayjs(iso)
  return d.isValid() ? d.format('HH:mm:ss') : ''
}

/** Event snapshot — image when available, else a "no image" placeholder.
 *  Shared by the table cell and the grid card. */
export const EventSnapshot: React.FC<{
  url?: string
  className?: string
  onClick?: () => void
}> = ({ url, className = '', onClick }) => {
  const clickable = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt='ภาพเหตุการณ์'
      className={`object-cover ${clickable} ${className}`}
      onClick={onClick}
      title={onClick ? 'คลิกเพื่อดูรายละเอียดเหตุการณ์' : undefined}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-[#0e0e0e] text-gray-600 ${clickable} ${className}`}
      onClick={onClick}
      title={onClick ? 'คลิกเพื่อดูรายละเอียดเหตุการณ์' : undefined}
    >
      <TbPhotoOff size={22} />
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────

const EventCard: React.FC<{ ev: IncidentTransactionItem; onSelect?: () => void }> = ({ ev, onSelect }) => {
  const typeId = ev.analytic_type_info.id
  const typeLabel = getEventTypeLabel(typeId, ev.analytic_type_info.analytic_type_name_th)
  return (
    <div className='flex flex-col gap-2 rounded-2xl p-4' style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className='flex items-center gap-2'>
        <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: getEventTypeColor(typeId) }} />
        <h4 className='mb-0 font-semibold' style={{ color: getEventTypeColor(typeId) }}>{typeLabel}</h4>
      </div>
      <p className='fs-11 text-gray-400 mb-0'>{fmtThaiDate(ev.date_time)} {fmtTime(ev.date_time)}</p>
      <div className='my-1 border-t border-dashed' style={{ borderColor: 'rgba(252,209,22,0.5)' }} />
      <p className='fs-11 leading-snug mb-0.5 line-clamp-2'>
        <span className='text-gray-400'>ชื่อกล้อง : </span>
        <span className='text-blue-400'>{ev.camera.camera_name}</span>
      </p>
      <p className='fs-11 text-gray-400 mb-1'>IP Address : {ev.camera.ip_address}</p>
      {/* 4:3 box matches the source snapshots (1024×768) so object-cover fills
        * without cropping the scene — h-40 was chopping off top/bottom. */}
      <EventSnapshot url={ev.image_path} className='w-full aspect-[4/3] rounded-lg' onClick={onSelect} />
    </div>
  )
}

interface Props {
  events: IncidentTransactionItem[]
  /** Open the event-detail modal for this row. */
  onSelect?: (ev: IncidentTransactionItem) => void
}

/** Grid view — one card per event (Tab2 "grid" mode). */
const EventGridView: React.FC<Props> = ({ events, onSelect }) => {
  if (events.length === 0) {
    return <div className='py-12 text-center text-white/30 text-sm'>ไม่พบเหตุการณ์</div>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {events.map((ev) => <EventCard key={ev.id} ev={ev} onSelect={() => onSelect?.(ev)} />)}
    </div>
  )
}

export default React.memo<Props>(EventGridView)
