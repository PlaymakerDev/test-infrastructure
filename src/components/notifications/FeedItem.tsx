"use client"
import React from 'react'
import { Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbAlertTriangle, TbTool, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useProjectBySolution } from '@/hooks/queries/maintenance'
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

/** Joins present parts with " • " (the Figma's separator), skipping blanks —
 *  solution / road / department are each nullable, so a line renders
 *  whatever it has or '-'. */
const dotJoin = (...parts: Array<string | null | undefined>) => {
  const present = parts.filter((p): p is string => !!p)
  return present.length ? present.join(' • ') : '-'
}

/** The bell keeps pending_approval separate from the case page's 3-state
 *  pill — an officer watching the bell wants to know a case is waiting on
 *  *them*. The first two speak of the signed notice (Figma, user
 *  2026-10-02): an officer-opened case stays waiting_doc, out of the
 *  contractor's sight, until it is uploaded (backend 2026-09-28), and goes
 *  open the moment it is. */
const CASE_STATUS: Record<CaseFeedItem['case']['status'], { label: string; color: string }> = {
  waiting_doc: { label: 'ยังไม่อัพโหลดหนังสือแจ้งซ่อมพร้อมลายเซ็น', color: '#E94C4C' },
  open: { label: 'อัพโหลดหนังสือแจ้งซ่อมพร้อมลายเซ็นเรียบร้อย', color: '#05F2DB' },
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

/** One feed row: unread dot + kind glyph + title + relative time, then the
 *  kind's own lines. A case row follows the Figma (2026-10-02): its project in
 *  yellow, bureau • road, จุดติดตั้ง, then the status pill. */
const FeedItem: React.FC<Props> = ({ item, clickable, onClick }) => {
  const title = item.kind === 'case' ? item.case.case_no : item.camera.name

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
          <TbTool size={16} className="shrink-0 text-(--yellow)" />
        ) : (
          <TbWifiOff size={16} className="shrink-0 text-(--light-gray-3)" />
        )}
        {/* Regular weight, as in the Figma — the dot is what marks unread.
            One step above the lines below, no more (user 2026-10-02). */}
        <span className={`fs-14 font-normal truncate ${item.is_read ? 'text-white/85' : 'text-white'}`}>
          {title}
        </span>
        {/* occurred_at is the feed's own sort key — the one timestamp that
            means the same thing for both kinds. */}
        <Tooltip title={dayjs(item.occurred_at).locale('th').format('D MMM BBBB HH:mm:ss น.')}>
          <span className="ml-auto fs-14 text-(--light-gray) whitespace-nowrap shrink-0">
            {dayjs(item.occurred_at).locale('th').fromNow()}
          </span>
        </Tooltip>
      </div>

      {item.kind === 'case' ? <CaseLines item={item} /> : <OutageLines item={item} />}
    </button>
  )
}

/** The case's project in yellow, bureau • road, its จุดติดตั้ง, the pill. The
 *  feed names no project, so it comes from the solution — the same cached
 *  lookup the maintenance pages make; no project (or no access) falls back
 *  to the road's name. */
const CaseLines: React.FC<{ item: CaseFeedItem }> = ({ item }) => {
  const project = useProjectBySolution(item.solution?.id)
  const projectName = project.data?.project_name || (project.isLoading ? null : item.road?.name || null)
  return (
    <>
      {project.isLoading ? (
        <span className="block mt-1.5 h-3.5 w-3/4 rounded bg-white/10 animate-pulse" aria-hidden />
      ) : projectName ? (
        <p className="m-0 mt-1 fs-12 text-(--yellow) line-clamp-2" title={projectName}>{projectName}</p>
      ) : null}
      <p className="m-0 mt-0.5 fs-12 text-(--light-gray-3) truncate">
        {dotJoin(item.department?.short_name, item.road?.code)}
      </p>
      {item.solution?.name && (
        <p className="m-0 mt-0.5 fs-12 text-(--light-gray-3) truncate">จุดติดตั้ง : {item.solution.name}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <CaseStatus item={item} />
      </div>
    </>
  )
}

const OutageLines: React.FC<{ item: CameraOutageFeedItem }> = ({ item }) => (
  <>
    <p className="m-0 mt-1 fs-12 text-(--light-gray-3) truncate">{item.camera.ip_address || '-'}</p>
    <p className="m-0 mt-0.5 fs-12 text-(--light-gray-3) truncate">
      {dotJoin(item.department?.short_name, item.road?.code, item.solution?.name)}
    </p>
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      <OutageStatus item={item} />
    </div>
  </>
)

const OutageStatus: React.FC<{ item: CameraOutageFeedItem }> = ({ item }) => (
  <>
    <StatusPill color={item.is_open ? 'var(--red)' : '#22c55e'}>
      {item.is_open ? <TbWifiOff size={14} /> : <TbWifi size={14} />}
      {item.is_open ? 'กำลังดับ' : 'กลับมาแล้ว'}
    </StatusPill>
    {/* Recomputed server-side each poll while the camera is still down. */}
    <span className="fs-12 text-(--light-gray-3)">{formatDuration(item.duration_minutes)}</span>
  </>
)

const CaseStatus: React.FC<{ item: CaseFeedItem }> = ({ item }) => {
  // A status added to the backend later still renders, just unstyled.
  const meta = CASE_STATUS[item.case.status] ?? { label: item.case.status, color: '#979797' }
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
        <span className="fs-12 text-(--light-gray-3)">กล้อง {item.case.camera_count} ตัว</span>
      )}
    </>
  )
}

export default FeedItem
