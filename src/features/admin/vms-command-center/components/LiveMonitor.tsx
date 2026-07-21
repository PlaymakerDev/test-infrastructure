"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { App, Badge, Button, Empty, Popconfirm, Progress, Skeleton, Switch, Tooltip } from 'antd'
import { TbEye, TbPlayerStop } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useCommandCenterMonitor } from '../hooks/useCommandCenterMonitor'
import { useCancelVMSSetting } from '@/features/admin/control-vms/overall/hooks/useCancelVMSSetting'
import { statusMeta } from '../constants/vmsStatus'
import StatusPill from './StatusPill'
import { getThumbUrl, isVideoUrl } from '../utils/thumbnail'
import { VMSMonitorItem } from '@/types/vms/command-center-api'

dayjs.extend(relativeTime)

interface Props {
  vmsIds: number[]
  onOpenSignDetail?: (vmsId: number) => void
}

const relativeSince = (iso?: string) => {
  if (!iso) return '—'
  const d = dayjs(iso)
  if (!d.isValid()) return '—'
  return d.locale('th').fromNow()
}

const DAY_LABELS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
const formatDaysOfWeek = (mask?: number): string => {
  if (mask == null || mask === 0 || mask === 127) return 'ทุกวัน'
  const days: number[] = []
  for (let bit = 0; bit < 7; bit++) if (mask & (1 << bit)) days.push(bit + 1)
  if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'จันทร์ – ศุกร์'
  return days.map((d) => DAY_LABELS[d - 1]).join(', ')
}

// Combine date (YYYY-MM-DD) + time (HH:mm:ss) into a Dayjs.
// Returns null if either is missing/invalid.
const combine = (date?: string, time?: string): dayjs.Dayjs | null => {
  if (!date) return null
  const t = time && time.length >= 5 ? time : '00:00:00'
  const d = dayjs(`${date}T${t}`)
  return d.isValid() ? d : null
}

// Compute a schedule's window for TODAY (a schedule can span multiple days;
// the countdown/progress needs today's actual start/end datetimes).
const getSlotWindow = (it: VMSMonitorItem, nowMs: number): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null => {
  if (!it.date_since || !it.date_to) return null
  const isAllDay = it.is_all_day === true
  const timeSince = isAllDay ? '00:00:00' : (it.time_since || '00:00:00')
  const timeTo = isAllDay ? '23:59:59' : (it.time_to || '23:59:59')
  const rangeStart = combine(it.date_since, timeSince)
  const rangeEnd = combine(it.date_to, timeTo)
  if (!rangeStart || !rangeEnd) return null

  const today = dayjs(nowMs).startOf('day')
  // Multi-day: today's window is [today+timeSince .. today+timeTo] as long
  // as today is within [date_since..date_to] and days_of_week allows it.
  const isoDow = today.day() === 0 ? 7 : today.day() // Mon=1..Sun=7
  const mask = it.days_of_week ?? 127
  const dayAllowed = (mask & (1 << (isoDow - 1))) !== 0
  const withinDates = !today.isBefore(rangeStart.startOf('day')) && !today.isAfter(rangeEnd.startOf('day'))

  if (isAllDay || (!withinDates && !dayAllowed)) {
    // All-day mode: single continuous window [rangeStart, rangeEnd]
    return { start: rangeStart, end: rangeEnd }
  }
  if (!withinDates || !dayAllowed) {
    return null
  }
  return {
    start: today.hour(rangeStart.hour()).minute(rangeStart.minute()).second(rangeStart.second()),
    end: today.hour(rangeEnd.hour()).minute(rangeEnd.minute()).second(rangeEnd.second()),
  }
}

const formatDuration = (ms: number): string => {
  const abs = Math.abs(ms)
  const totalMin = Math.floor(abs / 60000)
  const hr = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (hr > 0) return `${hr} ชม. ${min} นาที`
  if (totalMin > 0) return `${totalMin} นาที`
  const sec = Math.floor(abs / 1000) % 60
  return `${sec} วินาที`
}

const LiveMonitor: React.FC<Props> = React.memo(function LiveMonitor({ vmsIds, onOpenSignDetail }) {
  const { data, isLoading, isFetching, dataUpdatedAt } = useCommandCenterMonitor(vmsIds, { refetchIntervalMs: 5_000 })
  const rows: VMSMonitorItem[] = data?.data ?? []
  const cancel = useCancelVMSSetting()
  const { message } = App.useApp()

  // Local tick so the countdown/progress refresh every second without a full
  // React Query refetch.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Terminal states (cancelled/done/overwrite/lost) linger for a grace window
  // so the operator gets a visual confirmation that the sign really transitioned
  // (e.g. "just cancelled" pill visible ~10 min after they clicked หยุด), then
  // auto-hide. Toggling `hideFinished` bypasses the grace and hides them
  // immediately for operators who want a strictly-active view. Long-form history
  // is in the ประวัติสั่งงานทั้งหมด tab.
  const [hideFinished, setHideFinished] = useState(false)

  const handleCancel = async (settingID?: number) => {
    if (!settingID) return
    try {
      await cancel.mutateAsync(settingID)
      message.success('ส่งคำสั่งหยุดเรียบร้อย — ป้ายจะเคลียร์จอในรอบ poll ถัดไป')
    } catch {
      message.error('หยุดไม่สำเร็จ (อาจเลย terminal state ไปแล้ว)')
    }
  }

  const lastUpdatedRel = dataUpdatedAt ? dayjs(dataUpdatedAt).locale('th').fromNow() : '—'

  // Summary counts by status kind
  const summary = useMemo(() => {
    const s = { active: 0, done: 0, cancel: 0, overwrite: 0, lost: 0, pending: 0 }
    for (const it of rows) {
      const m = statusMeta(it.status ?? undefined)
      if (m.isActive) s.active++
      else if (m.id === 4) s.done++
      else if (m.id === 5) s.lost++
      else if (m.id === 6) s.cancel++
      else if (m.id === 7) s.overwrite++
      else s.pending++
    }
    return s
  }, [rows])

  // Show all non-terminal rows always; terminal rows only within `TERMINAL_GRACE_MS`
  // of their last transition. `nowMs` ticks every 1s so cards fade out live.
  const TERMINAL_GRACE_MS = 10 * 60 * 1000
  const visible = rows.filter((r) => {
    const meta = statusMeta(r.status ?? undefined)
    if (!meta.isTerminal) return true
    if (hideFinished) return false
    const t = r.status_updated_at ? dayjs(r.status_updated_at).valueOf() : 0
    return t > 0 && nowMs - t < TERMINAL_GRACE_MS
  })

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-(--yellow)">ติดตามสถานะแบบเรียลไทม์</div>
            <div className="fs-12 opacity-60 mt-0.5">
              อัพเดตอัตโนมัติทุก 5 วินาที · ล่าสุด {lastUpdatedRel}{' '}
              {isFetching && <span className="opacity-70">(กำลังโหลด...)</span>}
            </div>
          </div>
          <Badge count={rows.length} showZero color="#f59e0b" overflowCount={999} />
        </div>
        {/* Summary counters */}
        {rows.length > 0 && (
          <div className="flex items-center gap-2 fs-12 flex-wrap">
            {summary.active > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span className="text-(--yellow)">●</span> กำลังทำงาน {summary.active}</span>}
            {summary.done > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span style={{ color: '#6b7280' }}>●</span> เสร็จสิ้น {summary.done}</span>}
            {summary.cancel > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span style={{ color: '#a855f7' }}>●</span> ยกเลิก {summary.cancel}</span>}
            {summary.overwrite > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span style={{ color: '#eab308' }}>●</span> ถูกสั่งทับ {summary.overwrite}</span>}
            {summary.lost > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span className="text-red-500">●</span> ขาดเชื่อมต่อ {summary.lost}</span>}
            {summary.pending > 0 && <span className="px-1.5 py-0.5 rounded bg-white/5"><span className="opacity-60">●</span> ยังไม่มีคำสั่ง {summary.pending}</span>}
            <span className="ml-auto flex items-center gap-1.5 opacity-70">
              <span>ซ่อนที่เสร็จแล้ว</span>
              <Switch size="small" checked={hideFinished} onChange={setHideFinished} />
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {vmsIds.length === 0 && <Empty description="เลือกป้ายจากคอลัมน์ซ้ายเพื่อเริ่มติดตาม" />}
        {vmsIds.length > 0 && isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
        {vmsIds.length > 0 && !isLoading && rows.length === 0 && (
          <Empty description="ไม่มีข้อมูลป้ายที่เลือก" />
        )}
        {vmsIds.length > 0 && !isLoading && rows.length > 0 && visible.length === 0 && (
          <div className="text-center fs-12 text-white/50 py-4">
            {hideFinished
              ? 'ป้ายทั้งหมดจบไปแล้ว — ปิด "ซ่อนที่เสร็จแล้ว" หรือดูใน ประวัติสั่งงานทั้งหมด'
              : 'ป้ายทั้งหมดจบไปแล้ว (เกิน 10 นาที) — ดูย้อนหลังในแท็บ ประวัติสั่งงานทั้งหมด'}
          </div>
        )}
        {visible.map((it) => {
          const meta = statusMeta(it.status ?? undefined)
          const hasActive = it.setting_id != null
          const isTerminal = meta.isTerminal
          const win = hasActive ? getSlotWindow(it, nowMs) : null
          const now = dayjs(nowMs)

          // Countdown state derived from window
          let countdown: React.ReactNode = null
          let progressPct: number | null = null
          if (win && !isTerminal) {
            if (now.isBefore(win.start)) {
              countdown = (
                <span className="text-(--default-blue)">จะเริ่มในอีก {formatDuration(win.start.valueOf() - nowMs)}</span>
              )
            } else if (now.isBefore(win.end)) {
              const total = win.end.valueOf() - win.start.valueOf()
              const done = nowMs - win.start.valueOf()
              progressPct = Math.max(0, Math.min(100, (done / total) * 100))
              countdown = (
                <span className="text-green-400">
                  กำลังเล่น · อีก {formatDuration(win.end.valueOf() - nowMs)} จะจบ
                </span>
              )
            } else {
              countdown = (
                <span className="text-white/50">หมดเวลาไปแล้ว {formatDuration(nowMs - win.end.valueOf())}</span>
              )
            }
          }

          return (
            <div
              key={it.vms_id}
              className="rounded-lg border border-white/10 bg-white/[.04] p-3 transition-opacity"
              style={{ opacity: isTerminal ? 0.65 : 1 }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate flex items-center gap-1.5">
                    {it.road_code && <span className="text-(--yellow) font-semibold">{it.road_code}</span>}
                    {it.sta && <span className="text-(--default-blue) fs-12">กม.{it.sta}</span>}
                    <span className="truncate opacity-80">{it.solution_name || `VMS ${it.vms_id}`}</span>
                  </div>
                  <div className="fs-12 opacity-60">
                    WID {it.wid} · vms_id {it.vms_id}
                    {it.road_name && <span className="ml-2 opacity-70">· {it.road_name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip
                    title={
                      <div className="fs-12">
                        <div>เชื่อมต่อ: {it.is_online ? 'ออนไลน์' : 'ออฟไลน์'}</div>
                        <div>last_seen: {it.last_seen_at ?? '—'}</div>
                      </div>
                    }
                  >
                    <span
                      className="inline-flex items-center gap-1 fs-12 px-2 py-0.5 rounded"
                      style={{
                        background: it.is_online ? '#22c55e22' : '#ef444422',
                        color: it.is_online ? '#22c55e' : '#ef4444',
                        border: `1px solid ${it.is_online ? '#22c55e55' : '#ef444455'}`,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: it.is_online ? '#22c55e' : '#ef4444',
                        }}
                      />
                      {it.is_online ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                  </Tooltip>
                  <StatusPill
                    status={it.status ?? 0}
                    tooltip={
                      hasActive
                        ? `อัพเดตล่าสุด ${relativeSince(it.status_updated_at)}`
                        : 'ยังไม่มีคำสั่ง'
                    }
                  />
                  <Tooltip title="ดูรายละเอียด">
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<TbEye style={{ verticalAlign: -2 }} />}
                      onClick={() => onOpenSignDetail?.(it.vms_id)}
                    />
                  </Tooltip>
                </div>
              </div>

              {hasActive && (
                <div className="mt-2 flex items-center gap-3">
                  {it.media_url ? (
                    <div
                      className="rounded overflow-hidden bg-black flex-shrink-0 relative"
                      style={{ width: 96, aspectRatio: '16/9' }}
                    >
                      {/* Thumbnail sibling (~15 KB) — a 5-second poll
                          across dozens of active cards used to re-fetch
                          full-res PNGs / MP4 posters. onError falls
                          back to original for pre-backfill uploads. */}
                      <img
                        src={getThumbUrl(it.media_url)}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget
                          if (img.dataset.fallback !== '1') {
                            img.dataset.fallback = '1'
                            img.src = isVideoUrl(it.media_url) ? '' : (it.media_url ?? '')
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {isVideoUrl(it.media_url) && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white fs-12">▶</span>
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 fs-12 opacity-90 space-y-0.5">
                    <div>
                      <b>{it.setting_type_name || '-'}</b>
                      {it.command_no != null && <span className="ml-2 opacity-70">คำสั่งที่ {it.command_no}</span>}
                    </div>
                    <div className="opacity-70">
                      <span className="opacity-70">วันที่:</span>{' '}
                      {it.date_since === it.date_to ? it.date_since : `${it.date_since} → ${it.date_to}`}
                    </div>
                    <div className="opacity-70">
                      <span className="opacity-70">เวลา:</span>{' '}
                      {it.is_all_day
                        ? <span className="text-(--yellow)">ตลอดวัน</span>
                        : it.time_since && it.time_to
                        ? `${it.time_since.slice(0, 5)} – ${it.time_to.slice(0, 5)}`
                        : '—'}
                      <span className="opacity-70 ml-2">· วัน:</span>{' '}
                      {formatDaysOfWeek(it.days_of_week)}
                    </div>
                    {countdown && <div>{countdown}</div>}
                    {it.message && <div className="opacity-70 truncate">{it.message}</div>}
                  </div>
                </div>
              )}

              {progressPct != null && (
                <div className="mt-2">
                  <Progress
                    percent={progressPct}
                    size="small"
                    showInfo={false}
                    strokeColor="#22c55e"
                    railColor="rgba(255,255,255,0.08)"
                  />
                </div>
              )}

              {hasActive && meta.isCancellable && (
                <div className="mt-2 flex items-center gap-2 justify-end">
                  <Popconfirm
                    title="หยุดการแสดงผลป้ายนี้?"
                    description="คำสั่งจะถูกทำเครื่องหมาย 'ยกเลิก' และป้ายจะเคลียร์จอในรอบ poll ถัดไป"
                    onConfirm={() => handleCancel(it.setting_id)}
                    okText="ยืนยันหยุด"
                    cancelText="ไม่"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<TbPlayerStop style={{ verticalAlign: -2 }} />}
                      loading={cancel.isPending}
                    >
                      หยุด
                    </Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default LiveMonitor
