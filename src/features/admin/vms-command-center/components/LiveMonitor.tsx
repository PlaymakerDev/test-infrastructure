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
  /** Signs the operator selected but the sign is explicitly opted-out
   *  (is_centralized=false in vmsinfo). Rendered as read-only placeholder
   *  cards under the "ไม่รองรับ" filter. */
  excludedSigns?: Array<{ vms_id: number; solution_name?: string; road_code?: string; sta?: string }>
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

type BucketFilter = 'all' | 'ready' | 'offline' | 'excluded'

const LiveMonitor: React.FC<Props> = React.memo(function LiveMonitor({
  vmsIds,
  excludedSigns = [],
  onOpenSignDetail,
}) {
  // Default filter is "รอคำสั่ง" — the operator's mental model is "I selected
  // these signs, show me the ones that will actually receive the dispatch".
  // Offline (queue-ahead) and excluded signs are one click away via their chips.
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('ready')
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

  // Operator explicit filter for terminal (done/cancelled/overwrite/lost)
  // cards. Off by default — mental model is "I selected these signs, show
  // me all of them regardless of past state" (fresh dispatch prep flow).
  // Toggle ON when the operator wants a strictly-active view.
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

  // Bucket each row by eligibility so filter chips (ready / offline / excluded)
  // can toggle the visible list. Every row from /command-center/monitor now
  // carries is_controllable directly (same tbl_vms_screen_info join as
  // /vms/screen-info and the departments/sidebar endpoint) — no separate
  // fetch or parent-computed Set needed. Rows are already limited to
  // immediate+queued signs by the parent (excluded signs are never queried),
  // so a plain is_controllable split is exact. Excluded signs are separate —
  // parent passes them as metadata for placeholder cards.
  const readyRows = useMemo(() => rows.filter((r) => r.is_controllable), [rows])
  const offlineRows = useMemo(() => rows.filter((r) => !r.is_controllable), [rows])

  const readyCount = readyRows.length
  const offlineCount = offlineRows.length
  const excludedCount = excludedSigns.length

  // Apply the operator's chip filter + explicit "ซ่อนที่เสร็จแล้ว" switch.
  const monitorVisible = useMemo(() => {
    let list = rows
    if (bucketFilter === 'ready') list = readyRows
    else if (bucketFilter === 'offline') list = offlineRows
    else if (bucketFilter === 'excluded') list = []  // placeholder cards only
    if (hideFinished) list = list.filter((r) => !statusMeta(r.status ?? undefined).isTerminal)
    return list
  }, [rows, readyRows, offlineRows, bucketFilter, hideFinished])
  const showExcludedPlaceholders = bucketFilter === 'all' || bucketFilter === 'excluded'

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
          <Badge count={readyCount + offlineCount + excludedCount} showZero color="#f59e0b" overflowCount={999} />
        </div>
        {/* Three-bucket filter chips — click to filter cards below. Reflects
            eligibility for dispatch, NOT per-sign command status (that's
            per-card via StatusPill). Total badge = ready + offline + excluded
            = ป้ายที่เลือกทั้งหมด. */}
        {(readyCount + offlineCount + excludedCount) > 0 && (
          <div className="flex items-center gap-2 fs-12 flex-wrap">
            <ChipToggle
              active={bucketFilter === 'all'}
              onClick={() => setBucketFilter('all')}
              tooltip="แสดงป้ายทั้งหมดที่เลือก"
              label={<span>ทั้งหมด {readyCount + offlineCount + excludedCount}</span>}
            />
            <ChipToggle
              active={bucketFilter === 'ready'}
              onClick={() => setBucketFilter(bucketFilter === 'ready' ? 'all' : 'ready')}
              tooltip="ป้ายพร้อมรับคำสั่งทันที"
              accent="#22c55e"
              label={
                <span>
                  <span style={{ color: '#22c55e' }}>●</span> พร้อมรับคำสั่ง {readyCount}
                </span>
              }
            />
            {offlineCount > 0 && (
              <ChipToggle
                active={bucketFilter === 'offline'}
                onClick={() => setBucketFilter(bucketFilter === 'offline' ? 'all' : 'offline')}
                tooltip="ป้ายไม่พร้อมใช้งาน"
                accent="#ef4444"
                label={
                  <span>
                    <span style={{ color: '#ef4444' }}>●</span> ไม่พร้อมใช้งาน {offlineCount}
                  </span>
                }
              />
            )}
            {excludedCount > 0 && (
              <ChipToggle
                active={bucketFilter === 'excluded'}
                onClick={() => setBucketFilter(bucketFilter === 'excluded' ? 'all' : 'excluded')}
                tooltip="ป้ายที่ agent ยังไม่เคย provision เลย หรือถูกถอดจาก centralized — ต้องมีคนไปตั้งค่า/ติดตั้งก่อน เปิดใช้งานได้ในแท็บ 'ข้อมูลป้าย VMS'"
                label={
                  <span>
                    <span className="text-(--yellow)">⚠</span> ไม่รองรับ {excludedCount}
                  </span>
                }
              />
            )}
            <span className="ml-auto flex items-center gap-1.5 opacity-70">
              <span>ซ่อนที่เสร็จแล้ว</span>
              <Switch size="small" checked={hideFinished} onChange={setHideFinished} />
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(vmsIds.length + excludedCount) === 0 && <Empty description="เลือกป้ายจากคอลัมน์ซ้ายเพื่อเริ่มติดตาม" />}
        {vmsIds.length > 0 && isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
        {vmsIds.length > 0 && !isLoading && rows.length === 0 && excludedCount === 0 && (
          <Empty description="ไม่มีข้อมูลป้ายที่เลือก" />
        )}
        {monitorVisible.length === 0 && rows.length > 0 && (bucketFilter === 'ready' || bucketFilter === 'offline') && (
          <div className="text-center fs-12 text-white/50 py-4">
            {bucketFilter === 'ready' ? 'ไม่มีป้ายพร้อมรับคำสั่งในกลุ่มที่เลือก' : 'ไม่มีป้าย offline ในกลุ่มที่เลือก'}
          </div>
        )}
        {monitorVisible.length === 0 && rows.length > 0 && bucketFilter === 'all' && excludedCount === 0 && hideFinished && (
          <div className="text-center fs-12 text-white/50 py-4">
            ป้ายทั้งหมดจบไปแล้ว — ปิด "ซ่อนที่เสร็จแล้ว" เพื่อดูอีกครั้ง
          </div>
        )}
        {monitorVisible.map((it) => {
          const meta = statusMeta(it.status ?? undefined)
          // A sign is "relevant" for dispatch prep only if it has a command
          // that is currently playing / queued to play. Terminal states
          // (cancelled / done / overwritten / lost) are historical noise — the
          // operator explicitly said "ฉันไม่สนใจว่าเคยทำอะไรมา" and history
          // is available in the ประวัติสั่งงานทั้งหมด tab. Cards for
          // terminal-only signs render exactly like empty signs.
          const isTerminal = meta.isTerminal
          const settingExists = it.setting_id != null
          const hasActive = settingExists && !isTerminal
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

          // Visual hint: cards WITHOUT an active setting are in "preview"
          // state — operator is inspecting who they're about to dispatch to,
          // no command has been sent yet. Dashed border + subtle dim so it's
          // instantly distinguishable from cards that are actually playing.
          // Terminal cards (done/cancelled/overwrite/lost) fade further to
          // signal they're on the grace-window countdown to auto-hide.
          // Terminal states now fall into the same "preview" (empty) bucket
          // — same dashed border, same subtle dim — so the operator sees the
          // sign as "ready to receive a new command" not "still hung up on
          // the last cancellation from three days ago".
          const preview = !hasActive
          return (
            <div
              key={it.vms_id}
              className={`rounded-lg border p-3 transition-opacity ${preview
                ? 'border-dashed border-white/15 bg-white/[.02]'
                : 'border-white/10 bg-white/[.04]'
                }`}
              style={{ opacity: preview ? 0.85 : 1 }}
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
                  {/* it.is_controllable (backend-computed, tbl_vms_screen_info
                      join) drives the pill — NOT it.is_online, which is the
                      legacy tv.last_connected heartbeat from a different agent
                      stack. Same field the bucket chips and sidebar dot use,
                      so a sign never shows ออนไลน์ here while reading Offline
                      elsewhere. */}
                  {(() => {
                    const canDispatchNow = it.is_controllable
                    return (
                      <Tooltip
                        title={
                          <div className="fs-12">
                            <div>เชื่อมต่อ: {canDispatchNow ? 'ออนไลน์' : 'ออฟไลน์'}</div>
                            <div>last_seen: {it.last_seen_at ?? '—'}</div>
                            {!canDispatchNow && <div className="opacity-70">คำสั่งจะ queue จนกว่า agent จะกลับมา online</div>}
                          </div>
                        }
                      >
                        <span
                          className="inline-flex items-center gap-1 fs-12 px-2 py-0.5 rounded"
                          style={{
                            background: canDispatchNow ? '#22c55e22' : '#ef444422',
                            color: canDispatchNow ? '#22c55e' : '#ef4444',
                            border: `1px solid ${canDispatchNow ? '#22c55e55' : '#ef444455'}`,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: canDispatchNow ? '#22c55e' : '#ef4444',
                            }}
                          />
                          {canDispatchNow ? 'ออนไลน์' : 'ออฟไลน์'}
                        </span>
                      </Tooltip>
                    )
                  })()}
                  {hasActive ? (
                    <StatusPill
                      status={it.status ?? 0}
                      tooltip={`อัพเดตล่าสุด ${relativeSince(it.status_updated_at)}`}
                    />
                  ) : (
                    // Card pill for a sign with no relevant command — reads
                    // as "ready to receive a dispatch" (รอคำสั่ง). Terminal
                    // states (cancelled/done/overwrite/lost) fall through
                    // here too because `hasActive` now excludes them.
                    <Tooltip title="ป้ายพร้อมรับคำสั่งใหม่ — ยังไม่มี command ที่กำลังเล่นหรือกำลังจะเล่น">
                      <span
                        className="inline-flex items-center gap-1 fs-12 px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px dashed rgba(255,255,255,0.2)',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                          }}
                        />
                        รอคำสั่ง
                      </span>
                    </Tooltip>
                  )}
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

              {/* Only render the media/schedule detail block for actively-running
                  or queued-to-run commands (hasActive already excludes terminal
                  states). History belongs in ประวัติสั่งงานทั้งหมด. */}
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
        {/* Placeholder cards for excluded (ไม่รองรับ) signs — read-only,
            no polling, just so the operator can visually reconcile "which
            of my 4 selected signs are unsupported" without cross-referencing
            the ScopePicker column. */}
        {showExcludedPlaceholders && excludedSigns.map((s) => (
          <div
            key={`excluded-${s.vms_id}`}
            className="rounded-lg border border-dashed border-(--yellow)/40 bg-(--yellow)/[.03] p-3 opacity-80"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {s.road_code && <span className="text-(--yellow) font-semibold">{s.road_code}</span>}
                  {s.sta && <span className="text-(--default-blue) fs-12">กม.{s.sta}</span>}
                  <span className="truncate opacity-80">{s.solution_name || `VMS ${s.vms_id}`}</span>
                </div>
                <div className="fs-12 opacity-60">vms_id {s.vms_id}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip title="agent ยังไม่เคย provision เลย หรือถูกถอดจาก centralized — ต้องมีคนไปตั้งค่า/ติดตั้งก่อน เปิดใช้งานที่แท็บ 'ข้อมูลป้าย VMS'">
                  <span
                    className="inline-flex items-center gap-1 fs-12 px-2 py-0.5 rounded"
                    style={{
                      background: 'color-mix(in srgb, var(--yellow) 10%, transparent)',
                      color: 'var(--yellow)',
                      border: '1px solid var(--yellow)',
                    }}
                  >
                    ⚠ ไม่รองรับ
                  </span>
                </Tooltip>
                <Tooltip title="ดูรายละเอียด">
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<TbEye style={{ verticalAlign: -2 }} />}
                    onClick={() => onOpenSignDetail?.(s.vms_id)}
                  />
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Filter chip — same visual language as MediaLibraryTab's Chip but scoped
// to LiveMonitor so click-to-filter reads as a cohesive control row.
const ChipToggle: React.FC<{
  active: boolean
  onClick: () => void
  label: React.ReactNode
  tooltip?: string
  /** Accent color for border + text (+ fill when active). Default brand yellow. */
  accent?: string
}> = ({ active, onClick, label, tooltip, accent = '#FCD116' }) => {
  const inner = (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-0.5 rounded-full transition-colors border fs-12"
      style={{
        background: active ? accent : 'transparent',
        color: active ? '#191919' : accent,
        borderColor: accent,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
  return tooltip ? <Tooltip title={tooltip}>{inner}</Tooltip> : inner
}

export default LiveMonitor
