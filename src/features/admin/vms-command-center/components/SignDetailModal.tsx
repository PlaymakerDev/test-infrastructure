"use client"
import React, { useMemo } from 'react'
import { App, Badge, Button, ConfigProvider, Empty, Image, Modal, Popconfirm, Skeleton, Tag, Timeline, Tooltip } from 'antd'
import { TbCircleCheckFilled, TbPlayerStop, TbRefresh, TbWifi, TbWifiOff } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useSignDetail } from '../hooks/useSignDetail'
import { useVMSCrossingHistory } from '@/features/admin/control-vms/overall/hooks/useVMSCrossingHistory'
import { useCancelVMSSetting } from '@/features/admin/control-vms/overall/hooks/useCancelVMSSetting'
import { statusMeta, sourceLabel } from '../constants/vmsStatus'
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

  return (
    <ConfigProvider theme={{ token: { colorTextBase: '#0f172a' } }}>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width="min(1400px, 96vw)"
        centered
        destroyOnClose
        styles={{ body: { padding: 0, background: '#f8fafc', borderRadius: 12 } }}
      >
        {isLoading && (
          <div className="p-8">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        )}
        {!isLoading && detail && (
          <div className="flex flex-col text-slate-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">WID {detail.wid} · vms_id {detail.vms_id}</div>
                  <div className="text-lg font-semibold truncate">{detail.solution_name || `VMS ${detail.vms_id}`}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">{detail.crossing_master_index}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag
                    icon={detail.is_online ? <TbWifi style={{ verticalAlign: -2 }} /> : <TbWifiOff style={{ verticalAlign: -2 }} />}
                    color={detail.is_online ? 'success' : 'error'}
                    style={{ fontSize: 12 }}
                  >
                    {detail.is_online ? 'ออนไลน์' : 'ออฟไลน์'} · เห็นล่าสุด {fmt(detail.last_seen_at)}
                  </Tag>
                  <StatusPill
                    status={detail.status ?? 0}
                    tooltip={activeSettingID ? `setting #${activeSettingID} · อัพเดต ${fmt(detail.status_updated_at)}` : 'ยังไม่มีคำสั่ง'}
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
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
                  <div className="px-3 py-2 text-white/90 text-xs bg-slate-800 flex items-center justify-between">
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

                {/* Current setting content preview */}
                {activeSettingID && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500 mb-1">คำสั่งที่กำลังแสดง (setting #{activeSettingID})</div>
                    <div className="flex items-center gap-3">
                      {detail.media_url && (
                        <Image
                          src={detail.media_url}
                          width={120}
                          height={72}
                          preview={{ mask: 'ดูรูปใหญ่' }}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <div><b>{detail.setting_type_name || '-'}</b></div>
                        <div className="text-slate-500">
                          {detail.date_since} → {detail.date_to}
                        </div>
                        {detail.message && <div className="text-slate-600 mt-0.5">{detail.message}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attached cameras grid */}
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-semibold">กล้อง CCTV รอบป้าย</div>
                    <Badge count={cameras.length} showZero color="#f59e0b" overflowCount={99} />
                  </div>
                  {cameras.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      ยังไม่มีกล้อง CCTV ผูกกับป้ายนี้
                    </div>
                  ) : (
                    <div
                      className="grid gap-2 p-2"
                      style={{ gridTemplateColumns: cameras.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    >
                      {cameras.map((cam) => (
                        <div key={cam.camera_id} className="rounded-md overflow-hidden border border-slate-200 bg-black">
                          <div className="px-2 py-1.5 bg-slate-900 flex items-center justify-between gap-2">
                            <div className="text-white text-xs truncate">{cam.camera_name || cam.ip_address || cam.camera_id.slice(0, 8)}</div>
                            <span
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
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
                            <div className="h-40 flex items-center justify-center text-white/60 text-xs">ไม่มี HLS URL</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: timeline */}
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-sm font-semibold">ประวัติสถานะ (300 รายการล่าสุด)</div>
                  <TbRefresh className="text-slate-400" />
                </div>
                <div className="max-h-[720px] overflow-y-auto p-3">
                  {history.length === 0 ? (
                    <Empty description="ยังไม่มีประวัติ" />
                  ) : (
                    <Timeline
                      items={history.map((r) => {
                        const meta = statusMeta(r.status)
                        const at = dayjs(r.reported_at)
                        return {
                          color: meta.color,
                          dot: (
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
                          children: (
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <StatusPill status={r.status} size="sm" />
                                {r.prev_status != null && r.prev_status !== r.status && (
                                  <span className="text-xs text-slate-500">
                                    จาก {statusMeta(r.prev_status).label} →
                                  </span>
                                )}
                                <span className="text-xs text-slate-600">{sourceLabel(r.source)}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                <Tooltip title={at.format('YYYY-MM-DD HH:mm:ss')}>
                                  <span>{at.format('DD MMM YYYY HH:mm:ss')} · {at.locale('th').fromNow()}</span>
                                </Tooltip>
                              </div>
                              {r.setting_type_name && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  เนื้อหา: {r.setting_type_name} · setting #{r.setting_id}
                                </div>
                              )}
                            </div>
                          ),
                        }
                      })}
                    />
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
