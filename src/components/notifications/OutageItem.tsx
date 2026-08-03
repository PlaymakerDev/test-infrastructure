"use client"
import React from 'react'
import { Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { CameraOutageItem } from '@/types/manage/notification-api'

dayjs.extend(relativeTime)
dayjs.extend(buddhistEra)

/** "45 นาที" / "3 ชม." / "2 วัน" — the spec's duration buckets (§6). */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} นาที`
  if (minutes < 1440) return `${Math.round(minutes / 60)} ชม.`
  return `${Math.round(minutes / 1440)} วัน`
}

/** Joins present parts with " · ", skipping nulls — solution/road/department
 *  are all nullable (§4), so a line renders whatever it has or '-'. */
const dotJoin = (...parts: Array<string | null | undefined>) => {
  const present = parts.filter((p): p is string => !!p)
  return present.length ? present.join(' · ') : '-'
}

interface Props {
  item: CameraOutageItem
  onClick: (item: CameraOutageItem) => void
}

/** One outage row (§6): unread dot + camera name, relative started_at with a
 *  full-timestamp tooltip, place lines, open/recovered pill, duration. */
const OutageItem: React.FC<Props> = ({ item, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(item)}
    // Backgrounds are classes (not inline style) so the hover variant can
    // actually win — an inline background would override hover: forever.
    className={`w-full text-left px-4 py-3 cursor-pointer border-0 border-b border-solid border-white/10 transition-colors hover:bg-(--mid-gray) ${
      item.is_read ? 'bg-transparent' : 'bg-[rgba(102,174,255,0.08)]'
    }`}
  >
    <div className="flex items-center gap-2">
      {!item.is_read && (
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--default-blue)' }}
        />
      )}
      <span
        className={`fs-14 truncate ${item.is_read ? 'font-normal text-white/85' : 'font-bold text-white'}`}
      >
        {item.camera.name}
      </span>
      {/* started_at = when the stream actually died — never detected_at (§4) */}
      <Tooltip title={dayjs(item.started_at).locale('th').format('D MMM BBBB HH:mm:ss น.')}>
        <span className="ml-auto fs-12 text-(--light-gray-3) whitespace-nowrap shrink-0">
          {dayjs(item.started_at).locale('th').fromNow()}
        </span>
      </Tooltip>
    </div>
    <p className="m-0 mt-1 fs-12 text-white/60 truncate">
      {dotJoin(item.solution?.name, item.road?.code)}
    </p>
    <p className="m-0 mt-0.5 fs-12 text-white/60 truncate">
      {dotJoin(item.department?.short_name, item.camera.ip_address)}
    </p>
    <div className="flex items-center gap-2 mt-1.5">
      <span
        className="inline-flex items-center py-0.5 px-2.5 rounded-full fs-12 whitespace-nowrap border border-solid"
        style={
          item.is_open
            ? { borderColor: 'var(--red)', color: 'var(--red)' }
            : { borderColor: '#22c55e', color: '#22c55e' }
        }
      >
        {item.is_open ? 'กำลังดับ' : 'กลับมาแล้ว'}
      </span>
      {/* Grows while is_open — value is fresh per poll, rendered as-is */}
      <span className="fs-12 text-white/60">{formatDuration(item.duration_minutes)}</span>
    </div>
  </button>
)

export default OutageItem
