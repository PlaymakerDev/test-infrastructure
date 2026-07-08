"use client"
import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Skeleton } from 'antd'
import { TbPhotoOff } from 'react-icons/tb'
import dayjs from 'dayjs'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import {
  useIncidentCentralList,
  useIncidentTransactions,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'
import EventDetailModal from '@/features/admin/incident-detection/components/EventDetailModal'
import { thaiDateBE } from '@/utils/thaiDate'

const EventThumbnail: React.FC<{ url?: string; onClick?: () => void }> = ({ url, onClick }) => {
  const className = `w-full h-full ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt='event snapshot'
        className={`${className} object-cover`}
        onClick={onClick}
        title={onClick ? 'คลิกเพื่อดูรายละเอียดเหตุการณ์' : undefined}
      />
    )
  }
  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-1`}
      style={{ background: '#0e0e0e' }}
      onClick={onClick}
      title={onClick ? 'คลิกเพื่อดูรายละเอียดเหตุการณ์' : undefined}
    >
      <TbPhotoOff size={20} style={{ color: '#555' }} />
      <span className='fs-10 text-gray-500'>ไม่มีรูปภาพ</span>
    </div>
  )
}

// Gradient border (#212121 → #66AEFF, 2px) — dual-background trick.
const CARD_BG = 'linear-gradient(#1c1c1c, #1c1c1c) padding-box, linear-gradient(135deg, #212121, #66AEFF) border-box'

/** Format ISO date_time (e.g. "2026-06-23T15:47:03+07:00") → "23 มิ.ย. 2569 15:47:03". */
const fmtThaiDateTime = (iso: string): string => {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  return `${thaiDateBE(iso)} ${d.format('HH:mm:ss')}`
}

const EventCard: React.FC<{ ev: IncidentTransactionItem; onOpenDetail: () => void }> = ({ ev, onOpenDetail }) => {
  const typeId = ev.analytic_type_info.id
  const typeLabel = getEventTypeLabel(typeId, ev.analytic_type_info.analytic_type_name_th)
  return (
    <div
      className='flex gap-3 p-3 rounded-2xl'
      style={{ background: CARD_BG, border: '2px solid transparent' }}
    >
      <div className='w-28 shrink-0 rounded-lg overflow-hidden' style={{ height: 96 }}>
        <EventThumbnail url={ev.image_path} onClick={onOpenDetail} />
      </div>
      <div className='flex-1 min-w-0 flex flex-col'>
        <div className='flex items-center gap-2'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: getEventTypeColor(typeId) }} />
          <span className='font-semibold text-white truncate'>{typeLabel}</span>
        </div>
        <p className='fs-11 text-gray-400 mt-0.5'>{fmtThaiDateTime(ev.date_time)}</p>
        <div className='my-1.5 border-t border-dashed' style={{ borderColor: 'rgba(252,209,22,0.5)' }} />
        <p className='fs-11 leading-snug line-clamp-2 mb-0.5'>
          <span className='text-gray-400'>ชื่อกล้อง : </span>
          <span className='text-blue-400'>{ev.camera.camera_name}</span>
        </p>
        <p className='fs-11 text-gray-400 mb-0'>IP Address : {ev.camera.ip_address}</p>
      </div>
    </div>
  )
}

interface Props {
  /** "ดูเพิ่มเติม" handler — switches the detail page to the EVENTS tab. */
  onShowAll?: () => void
}

/** Left column — "เหตุการณ์ล่าสุดวันนี้". Fetches up to 10 most-recent rows
 *  for this solution from /details/transactions. "ดูเพิ่มเติม" jumps to the
 *  EVENTS tab where the full paginated list lives. */
const EventListSection: React.FC<Props> = ({ onShowAll }) => {
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id
  const deptId = useDeptId()
  const today = dayjs().format('YYYY-MM-DD')
  const { data, isLoading } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: today,
    end_date: today,
    page: 1,
    // Compact preview — full list lives in Tab2 ("ดูเพิ่มเติม" jumps there).
    limit: 4,
  })
  // Road code for the EventDetailModal "จุดติดตั้ง" line — not on the event
  // row itself. Same cache as the rest of the detail page.
  const { data: central } = useIncidentCentralList(deptId)
  const roadCode = useMemo(() => {
    if (!solutionId || !central) return undefined
    const target = String(solutionId)
    for (const bureau of central) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (String(sol.solution.id) === target) return sol.road.code_name
        }
      }
    }
    return undefined
  }, [central, solutionId])

  const events = data?.res_data ?? []
  const [selected, setSelected] = useState<IncidentTransactionItem | null>(null)

  return (
    <div className='flex flex-col gap-3 h-full min-h-0'>
      <div className='flex items-center justify-between shrink-0'>
        <h4 className='mb-0' style={{ color: '#FCD116' }}>เหตุการณ์ล่าสุดวันนี้</h4>
        <button
          type='button'
          onClick={onShowAll}
          className='rounded-full px-4 py-1 fs-12 font-medium cursor-pointer'
          style={{ background: '#FCD116', color: '#212121' }}
        >
          ดูเพิ่มเติม
        </button>
      </div>
      <div className='flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1'>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : events.length === 0 ? (
          // Wrap the empty message in the same card as an event row so it stays
          // readable over the map (plain text was too low-contrast).
          <div
            className='flex items-center justify-center py-10 rounded-2xl'
            style={{ background: CARD_BG, border: '2px solid transparent' }}
          >
            <span className='fs-13 text-gray-300'>ยังไม่มีเหตุการณ์วันนี้</span>
          </div>
        ) : (
          events.map((ev) => (
            <EventCard key={ev.id} ev={ev} onOpenDetail={() => setSelected(ev)} />
          ))
        )}
      </div>
      <EventDetailModal
        open={!!selected}
        event={selected}
        roadCode={roadCode}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

export default React.memo(EventListSection)
