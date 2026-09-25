"use client"
import React from 'react'
import { Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbAlertTriangle, TbTool, TbWifi, TbWifiOff } from 'react-icons/tb'
import type {
  CameraOutageFeedItem,
  CaseFeedItem,
  NotificationFeedItem,
} from '@/types/manage/notification-api'

dayjs.extend(relativeTime)
dayjs.extend(buddhistEra)

/** "45 นาที" / "3 ชม." / "2 วัน" — the outage duration buckets. */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} นาที`
  if (minutes < 1440) return `${Math.round(minutes / 60)} ชม.`
  return `${Math.round(minutes / 1440)} วัน`
}

/** Joins present parts with " · ", skipping blanks — solution / road /
 *  department are each nullable, so a line renders whatever it has or '-'. */
const dotJoin = (...parts: Array<string | null | undefined>) => {
  const present = parts.filter((p): p is string => !!p)
  return present.length ? present.join(' · ') : '-'
}

/** Colours mirror the maintenance case pill (`caseStatus.ts`) so the same
 *  case reads the same in the bell and on its page. The bell keeps
 *  pending_approval separate — an officer watching the bell wants to know a
 *  case is waiting on *them*, which the page's 3-state pill folds away. */
const CASE_STATUS: Record<CaseFeedItem['case']['status'], { label: string; color: string }> = {
  open: { label: 'เปิด', color: '#E94C4C' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#FCD116' },
  pending_approval: { label: 'รอตรวจรับ', color: '#66AEFF' },
  closed: { label: 'ปิดแล้ว', color: '#05F2DB' },
}

const StatusPill: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full fs-12 whitespace-nowrap border border-solid"
    style={{ borderColor: color, color }}
  >
    {children}
  </span>
)

interface Props {
  item: NotificationFeedItem
  /** False → the row still marks itself read but never navigates (role
   *  `user` on a case row, or an outage with no install point). */
  clickable: boolean
  onClick: (item: NotificationFeedItem) => void
}

/** One feed row. Both kinds share this anatomy so the mixed list reads as one
 *  list: unread dot + title + relative time · descriptor · place · status. */
const FeedItem: React.FC<Props> = ({ item, clickable, onClick }) => {
  const title = item.kind === 'case' ? item.case.case_no : item.camera.name

  // category is "" rather than null when unset, so a truthy test is the right
  // check; the problem text then stands in for it.
  const descriptor =
    item.kind === 'case'
      ? item.case.category || item.case.problem
      : item.camera.ip_address

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      // Backgrounds are classes (not inline style) so the hover variant can
      // actually win — an inline background would override hover: forever.
      className={`w-full text-left px-4 py-3 border-0 border-b border-solid border-white/10 transition-colors hover:bg-(--mid-gray) ${clickable ? 'cursor-pointer' : 'cursor-default'
        } ${item.is_read ? 'bg-transparent' : 'bg-[rgba(102,174,255,0.08)]'}`}
    >
      <div className="flex items-center gap-2">
        {!item.is_read && (
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: 'var(--default-blue)' }}
          />
        )}
        {/* Kind glyph — the only always-visible cue telling the two apart
            before reading any text. */}
        {item.kind === 'case' ? (
          <TbTool size={14} className="shrink-0 text-(--yellow)" />
        ) : (
          <TbWifiOff size={14} className="shrink-0 text-(--light-gray-3)" />
        )}
        <span
          className={`fs-14 truncate ${item.is_read ? 'font-normal text-white/85' : 'font-bold text-white'}`}
        >
          {title}
        </span>
        {/* occurred_at is the feed's own sort key — the one timestamp that
            means the same thing for both kinds. */}
        <Tooltip title={dayjs(item.occurred_at).locale('th').format('D MMM BBBB HH:mm:ss น.')}>
          <span className="ml-auto fs-12 text-(--light-gray-3) whitespace-nowrap shrink-0">
            {dayjs(item.occurred_at).locale('th').fromNow()}
          </span>
        </Tooltip>
      </div>

      <p className="m-0 mt-1 fs-12 text-white/60 truncate">{descriptor || '-'}</p>
      <p className="m-0 mt-0.5 fs-12 text-white/60 truncate">
        {dotJoin(item.department?.short_name, item.road?.code, item.solution?.name)}
      </p>

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {item.kind === 'case' ? <CaseStatus item={item} /> : <OutageStatus item={item} />}
      </div>
    </button>
  )
}

const OutageStatus: React.FC<{ item: CameraOutageFeedItem }> = ({ item }) => (
  <>
    <StatusPill color={item.is_open ? 'var(--red)' : '#22c55e'}>
      {item.is_open ? <TbWifiOff size={14} /> : <TbWifi size={14} />}
      {item.is_open ? 'กำลังดับ' : 'กลับมาแล้ว'}
    </StatusPill>
    {/* Recomputed server-side each poll while the camera is still down. */}
    <span className="fs-12 text-white/60">{formatDuration(item.duration_minutes)}</span>
  </>
)

const CaseStatus: React.FC<{ item: CaseFeedItem }> = ({ item }) => {
  const meta = CASE_STATUS[item.case.status]
  const overdue = Boolean(
    item.is_open && item.case.due_date && dayjs(item.case.due_date).isBefore(dayjs()),
  )
  return (
    <>
      <StatusPill color={meta.color}>{meta.label}</StatusPill>
      {overdue && (
        <StatusPill color="var(--red)">
          <TbAlertTriangle size={14} />
          เลยกำหนด
        </StatusPill>
      )}
      {/* 0 means the case is filed against an install point, not a device
          list — showing "กล้อง 0 ตัว" would just be wrong. */}
      {item.case.camera_count > 0 && (
        <span className="fs-12 text-white/60">กล้อง {item.case.camera_count} ตัว</span>
      )}
    </>
  )
}

export default FeedItem
