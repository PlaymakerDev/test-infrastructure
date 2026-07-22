"use client"
import React, { useMemo } from 'react'
import { App, Badge, Button, ConfigProvider, Empty, Image, Modal, Popconfirm, Skeleton, Tag, Timeline, Tooltip } from 'antd'
import { TbAppWindow, TbCircleCheckFilled, TbPlayerStop, TbRefresh, TbWifi, TbWifiOff } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useSignDetail } from '../hooks/useSignDetail'
import { useVMSCrossingHistory } from '@/features/admin/control-vms/overall/hooks/useVMSCrossingHistory'
import { useCancelVMSSetting } from '@/features/admin/control-vms/overall/hooks/useCancelVMSSetting'
import { statusMeta, sourceLabel } from '../constants/vmsStatus'
import { getThumbUrl, isVideoUrl } from '../utils/thumbnail'
import StatusPill from './StatusPill'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { VMSSignCamera } from '@/types/vms/command-center-api'

dayjs.extend(relativeTime)

interface Props {
  open: boolean
  onClose: () => void
  vmsId: number | null
}

const fmt = (iso?: string) => (iso ? dayjs(iso).locale('th').fromNow() : '—')

// Backend stores days_of_week as a 7-bit mask (Mon=bit0 … Sun=bit6, 127=all).
// Some responses ship it as a number, some as an ISO-array — accept either.
const DAY_LABELS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
const formatDaysOfWeek = (input: number | number[] | undefined | null): string => {
  const days: number[] = []
  if (Array.isArray(input)) {
    // ISO 1..7 array
    for (const d of input) if (d >= 1 && d <= 7) days.push(d)
  } else if (typeof input === 'number') {
    for (let bit = 0; bit < 7; bit++) if (input & (1 << bit)) days.push(bit + 1)
  }
  if (days.length === 0 || days.length === 7) return 'ทุกวัน'
  if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'จันทร์ – ศุกร์'
  return days.map((d) => DAY_LABELS[d - 1]).join(', ')
}

const SignDetailModal: React.FC<Props> = ({ open, onClose, vmsId }) => {
  const { message } = App.useApp()
  const { data, isLoading } = useSignDetail(vmsId, { refetchIntervalMs: open ? 5_000 : undefined })
  const detail = data?.data
  const cmi = detail?.crossing_master_index
  const { data: histData } = useVMSCrossingHistory(cmi, {
    enabled: open && !!cmi,
    refetchIntervalMs: open ? 5_000 : undefined,
    limit: 300,
  })
  const history = histData?.data ?? []
  const cancel = useCancelVMSSetting()

  const activeSettingID = detail?.setting_id
  const activeMeta = useMemo(() => statusMeta(detail?.status ?? undefined), [detail?.status])
  const canCancel = activeSettingID != null && activeMeta.isCancellable

  const doCancel = async () => {
    if (!activeSettingID) return
    try {
      await cancel.mutateAsync(activeSettingID)
      message.success('ส่งคำสั่งหยุดเรียบร้อย')
    } catch {
      message.error('หยุดไม่สำเร็จ')
    }
  }

  const cameras: VMSSignCamera[] = detail?.cameras ?? []
  const screenURL = detail?.desktop_screen_url

  // detail.is_controllable / is_centralized / is_reported come straight from
  // the /vms/command-center/sign/:id endpoint's own tbl_vms_screen_info join —
  // same formula as the departments (sidebar) and monitor endpoints, so this
  // modal always agrees with LiveMonitor's bucket chips and the sidebar dot
  // without a separate fetch. detail.is_online is the LEGACY tv.last_connected
  // heartbeat and is NOT used for the connectivity pill below.
  //
  // is_reported=false (never provisioned, ever) is grouped into "ไม่รองรับ"
  // alongside is_centralized=false (explicitly opted out) — both need a
  // technician/admin action before this sign can ever be controllable,
  // unlike a normal offline sign which just needs to reconnect on its own.
  const isExcluded = detail?.is_centralized === false || detail?.is_reported === false
  const canDispatchNow = detail?.is_controllable ?? false

  return (
    <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(1400px, 96vw)"
      centered
      destroyOnHidden
      closable={{ 'aria-label': 'Close' }}
      classNames={{ container: 'border-2! border-(--default-blue)!' }}
      styles={{ body: { padding: 0 } }}
    >
        {isLoading && (
          <div className="p-8">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        )}
        {!isLoading && detail && (
          <div className="flex flex-col text-white/90">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-(--dark-black) rounded-t-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="fs-12 text-white/50">WID {detail.wid} · vms_id {detail.vms_id}</div>
                  <div className="text-lg font-semibold truncate flex items-center gap-2 flex-wrap">
                    {detail.road_code && <span className="text-(--yellow)">{detail.road_code}</span>}
                    {detail.sta && <span className="text-(--default-blue) text-sm">กม.{detail.sta}</span>}
                    <span className="truncate">{detail.solution_name || `VMS ${detail.vms_id}`}</span>
                  </div>
                  {detail.road_name && (
                    <div className="fs-12 text-white/50 mt-0.5">สายทาง: {detail.road_name}</div>
                  )}
                  <div className="fs-12 text-white/50 mt-0.5 font-mono">{detail.crossing_master_index}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Connectivity pill — themed (see feedback_theme_no_invent).
                      Three states, matching LiveMonitor's bucket chips exactly:
                        ไม่รองรับ (yellow)  — opted out of centralized control
                        ออนไลน์   (blue)    — controllable right now
                        ออฟไลน์   (red)     — will queue-ahead on dispatch */}
                  {isExcluded ? (
                    <Tooltip
                      title={
                        detail?.is_reported === false
                          ? 'agent ยังไม่เคย provision ป้ายนี้เลย — ต้องส่งช่างไปติดตั้ง/เริ่ม agent ก่อน'
                          : "ป้ายนี้ถูกถอดจากกลุ่มควบคุมรวม — เปิดใช้งานได้ในแท็บ 'ข้อมูลป้าย VMS'"
                      }
                    >
                      <span
                        className="inline-flex items-center gap-1.5 fs-12 px-2.5 py-1 rounded"
                        style={{
                          background: 'color-mix(in srgb, var(--yellow) 12%, transparent)',
                          border: '1px solid var(--yellow)',
                          color: 'var(--yellow)',
                        }}
                      >
                        <TbWifiOff style={{ verticalAlign: -2 }} />
                        ไม่รองรับ
                      </span>
                    </Tooltip>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 fs-12 px-2.5 py-1 rounded"
                      style={{
                        background: `color-mix(in srgb, var(${canDispatchNow ? '--default-blue' : '--red'}) 12%, transparent)`,
                        border: `1px solid var(${canDispatchNow ? '--default-blue' : '--red'})`,
                        color: `var(${canDispatchNow ? '--default-blue' : '--red'})`,
                      }}
                    >
                      {canDispatchNow ? <TbWifi style={{ verticalAlign: -2 }} /> : <TbWifiOff style={{ verticalAlign: -2 }} />}
                      {canDispatchNow ? 'ออนไลน์' : 'ออฟไลน์'} · เห็นล่าสุด {fmt(detail.last_seen_at)}
                    </span>
                  )}
                  {/* Anydesk deep-link — uses the `anydesk:` URL scheme so
                      clicking hands off to the native client (same pattern as
                      legacy DetailTitle.tsx). Disabled visual if no id. */}
                  <Tooltip title={detail.anydesk_id ? `เปิด Anydesk #${detail.anydesk_id}` : 'ไม่มี Anydesk ID'}>
                    <Button
                      icon={<TbAppWindow style={{ verticalAlign: -2 }} />}
                      disabled={!detail.anydesk_id}
                      onClick={() => {
                        if (!detail.anydesk_id) return
                        window.location.href = `anydesk:${detail.anydesk_id}`
                      }}
                      style={{
                        background: detail.anydesk_id ? 'color-mix(in srgb, var(--default-blue) 12%, transparent)' : undefined,
                        borderColor: detail.anydesk_id ? 'var(--default-blue)' : undefined,
                        color: detail.anydesk_id ? 'var(--default-blue)' : undefined,
                      }}
                    >
                      Anydesk : {detail.anydesk_id || '-'}
                    </Button>
                  </Tooltip>
                  <StatusPill
                    status={detail.status ?? 0}
                    tooltip={
                      activeSettingID
                        ? `${detail.command_no != null ? `คำสั่งที่ ${detail.command_no}` : `setting #${activeSettingID}`} · อัพเดต ${fmt(detail.status_updated_at)}`
                        : 'ยังไม่มีคำสั่ง'
                    }
                  />
                  {canCancel && (
                    <Popconfirm
                      title="หยุดการแสดงผลป้ายนี้?"
                      onConfirm={doCancel}
                      okText="ยืนยันหยุด"
                      cancelText="ไม่"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<TbPlayerStop style={{ verticalAlign: -2 }} />} loading={cancel.isPending}>
                        หยุด
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            </div>

            {/* Body — 3 zones */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] gap-4 p-4">
              {/* Left column: screens + cameras */}
              <div className="space-y-4">
                {/* Live desktop screen of the sign itself */}
                <div className="rounded-lg overflow-hidden border border-white/10 bg-black">
                  <div className="px-3 py-2 text-white/90 fs-12 bg-black/50 flex items-center justify-between">
                    <span className="font-medium">Live screen ของป้าย</span>
                    <span className="opacity-70">{screenURL ? 'HLS' : '—'}</span>
                  </div>
                  {screenURL ? (
                    <HLSLivePlayer
                      hlsUrl={screenURL}
                      cameraId={`vms-${detail.vms_id}-screen`}
                      videoStyle={{ width: '100%', aspectRatio: '16/9', background: '#000' }}
                      autoPlay
                      muted
                      showLiveBadge
                    />
                  ) : (
                    <div className="h-40 flex items-center justify-center text-white/60 text-sm">ไม่มี stream ของป้ายในระบบ</div>
                  )}
                </div>

                {/* Current setting content preview — label switches when the
                    setting has already reached a terminal state (4/6/7) so
                    the card doesn't lie ("กำลังแสดง" for a finished run). */}
                {activeSettingID && (
                  <div className="rounded-lg border border-white/10 bg-(--dark-black) p-3">
                    <div className="fs-12 text-white/50 mb-1">
                      {(() => {
                        const label = detail.command_no != null
                          ? `คำสั่งที่ ${detail.command_no}`
                          : `setting #${activeSettingID}`
                        const heading = activeMeta.isActive
                          ? 'คำสั่งที่กำลังแสดง'
                          : activeMeta.id === 4
                          ? 'คำสั่งล่าสุด (เสร็จสิ้นแล้ว)'
                          : activeMeta.id === 5
                          ? 'คำสั่งล่าสุด (ป้ายขาดการเชื่อมต่อ)'
                          : activeMeta.id === 6
                          ? 'คำสั่งล่าสุด (ถูกยกเลิก)'
                          : activeMeta.id === 7
                          ? 'คำสั่งล่าสุด (ถูกสั่งทับด้วยคำสั่งอื่น)'
                          : 'คำสั่งล่าสุด'
                        return `${heading} (${label})`
                      })()}
                    </div>
                    <div className="flex items-center gap-3">
                      {detail.media_url && (
                        <div
                          className="rounded overflow-hidden bg-black flex-shrink-0 relative"
                          style={{ width: 160, aspectRatio: '16/9' }}
                        >
                          {/* Thumbnail sibling (~15 KB) — click to
                              preview reuses AntD Image's built-in
                              overlay + still loads full-res on tap. */}
                          <Image
                            src={getThumbUrl(detail.media_url)}
                            preview={{
                              mask: 'ดูรูปใหญ่',
                              src: detail.media_url,
                            }}
                            width="100%"
                            height="100%"
                            style={{ objectFit: 'contain' }}
                          />
                          {isVideoUrl(detail.media_url) && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-sm">▶</span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-sm space-y-0.5">
                        <div><b>{detail.setting_type_name || '-'}</b></div>
                        <div className="text-white/60 fs-12">
                          <span className="opacity-70">วันที่:</span>{' '}
                          {detail.date_since === detail.date_to
                            ? detail.date_since
                            : `${detail.date_since} → ${detail.date_to}`}
                        </div>
                        {detail.schedules?.map((sc) => {
                          const allDay = sc.time_since === '00:00:00' && (sc.time_to === '00:00:00' || sc.time_to === '23:59:00' || sc.time_to === '23:59:59')
                          const daysLabel = formatDaysOfWeek(sc.days_of_week)
                          return (
                            <div key={sc.id} className="text-white/60 fs-12">
                              <span className="opacity-70">เวลา:</span>{' '}
                              {allDay
                                ? <span className="text-(--yellow)">ตลอดวัน</span>
                                : <span>{sc.time_since.slice(0, 5)} – {sc.time_to.slice(0, 5)}</span>}
                              <span className="opacity-70 ml-2">· วัน:</span>{' '}
                              <span>{daysLabel}</span>
                              {sc.message && <div className="text-white/70 mt-0.5">{sc.message}</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attached cameras grid */}
                <div className="rounded-lg border border-white/10 bg-(--dark-black) overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-semibold">กล้อง CCTV รอบป้าย</div>
                    <Badge count={cameras.length} showZero color="#f59e0b" overflowCount={99} />
                  </div>
                  {cameras.length === 0 ? (
                    <div className="p-6 text-center text-sm text-white/50">
                      ยังไม่มีกล้อง CCTV ผูกกับป้ายนี้
                    </div>
                  ) : (
                    <div
                      className="grid gap-2 p-2"
                      style={{ gridTemplateColumns: cameras.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    >
                      {cameras.map((cam) => (
                        <div key={cam.camera_id} className="rounded-md overflow-hidden border border-white/10 bg-black">
                          <div className="px-2 py-1.5 bg-black/60 flex items-center justify-between gap-2">
                            <div className="text-white fs-12 truncate">{cam.camera_name || cam.ip_address || cam.camera_id.slice(0, 8)}</div>
                            <span
                              className="inline-flex items-center gap-1 fs-12 px-1.5 py-0.5 rounded"
                              style={{
                                background: cam.curl_status ? '#22c55e33' : '#ef444433',
                                color: cam.curl_status ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {cam.curl_status ? <TbCircleCheckFilled /> : <TbWifiOff />}
                              {cam.curl_status ? 'stream ok' : 'stream ผิดปกติ'}
                            </span>
                          </div>
                          {cam.hls_url ? (
                            <HLSLivePlayer
                              hlsUrl={cam.hls_url}
                              cameraId={cam.camera_id}
                              videoStyle={{ width: '100%', aspectRatio: '16/9', background: '#000' }}
                              autoPlay
                              muted
                              showLiveBadge
                            />
                          ) : (
                            <div className="h-40 flex items-center justify-center text-white/60 fs-12">ไม่มี HLS URL</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: timeline */}
              <div className="rounded-lg border border-white/10 bg-(--dark-black) overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <div className="text-sm font-semibold">ประวัติสถานะ (300 รายการล่าสุด)</div>
                  <TbRefresh className="text-white/40" />
                </div>
                <div className="max-h-[720px] overflow-y-auto p-3">
                  {history.length === 0 ? (
                    <Empty description="ยังไม่มีประวัติ" />
                  ) : (
                    <div className="space-y-4">
                      {/* Group history by setting_id — separator between commands
                          so a wall of same-command rows becomes scannable. */}
                      {(() => {
                        const groups: typeof history[] = []
                        let last: number | null = null
                        for (const r of history) {
                          if (r.setting_id !== last) {
                            groups.push([r])
                            last = r.setting_id
                          } else {
                            groups[groups.length - 1].push(r)
                          }
                        }
                        return groups.map((group, gi) => {
                          const head = group[0]
                          const label = head.command_no != null
                            ? `คำสั่งที่ ${head.command_no}`
                            : `setting #${head.setting_id}`
                          return (
                            <div key={`${head.setting_id}-${gi}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="fs-12 text-(--yellow) font-semibold">
                                  ▸ {label}
                                </span>
                                <span className="fs-12 text-white/50">
                                  {head.setting_type_name || 'อื่นๆ'} · {group.length} เหตุการณ์
                                </span>
                              </div>
                              <Timeline
                                items={(() => {
                                  // Belt-and-suspenders: collapse consecutive
                                  // rows sharing (status, source). New logs
                                  // don't produce dupes, but legacy rows still
                                  // exist — group into one line with "×N" +
                                  // time range so timelines stay scannable.
                                  const runs: { first: typeof group[number]; last: typeof group[number]; count: number }[] = []
                                  for (const r of group) {
                                    const cur = runs[runs.length - 1]
                                    if (cur && cur.last.status === r.status && cur.last.source === r.source && cur.last.prev_status === r.prev_status) {
                                      cur.last = r
                                      cur.count++
                                    } else {
                                      runs.push({ first: r, last: r, count: 1 })
                                    }
                                  }
                                  return runs
                                })().map((run) => {
                                  const r = run.first
                                  const meta = statusMeta(r.status)
                                  const at = dayjs(r.reported_at)
                                  const lastAt = dayjs(run.last.reported_at)
                                  return {
                                    color: meta.color,
                                    icon: (
                                      <span
                                        style={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: '50%',
                                          background: meta.color,
                                          boxShadow: `0 0 0 3px ${meta.ring}44`,
                                          display: 'inline-block',
                                        }}
                                      />
                                    ),
                                    content: (
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <StatusPill status={r.status} size="sm" />
                                          {r.prev_status != null && r.prev_status !== r.status && (
                                            <span className="fs-12 text-white/50">
                                              จาก {statusMeta(r.prev_status).label} →
                                            </span>
                                          )}
                                          <span className="fs-12 text-white/70">{sourceLabel(r.source)}</span>
                                          {run.count > 1 && (
                                            <span className="fs-12 px-1.5 py-0.5 rounded bg-white/5 text-(--yellow)">
                                              ×{run.count}
                                            </span>
                                          )}
                                        </div>
                                        <div className="fs-12 text-white/50 mt-1">
                                          <Tooltip title={at.format('YYYY-MM-DD HH:mm:ss')}>
                                            <span>
                                              {at.format('DD MMM YYYY HH:mm:ss')}
                                              {run.count > 1 && ` – ${lastAt.format('HH:mm:ss')}`}
                                              {' · '}
                                              {at.locale('th').fromNow()}
                                            </span>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    ),
                                  }
                                })}
                              />
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </Modal>
    </ConfigProvider>
  )
}

export default SignDetailModal
