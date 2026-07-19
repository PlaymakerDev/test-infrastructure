"use client"
import React, { useState } from 'react'
import { App, Badge, Button, Empty, Image, Popconfirm, Skeleton, Tooltip } from 'antd'
import { TbHistory, TbPlayerStop } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useCommandCenterMonitor } from '../hooks/useCommandCenterMonitor'
import { useCancelVMSSetting } from '@/features/admin/control-vms/overall/hooks/useCancelVMSSetting'
import { statusMeta } from '../constants/vmsStatus'
import StatusPill from './StatusPill'
import HistoryDrawer from './HistoryDrawer'
import { VMSMonitorItem } from '@/types/vms/command-center-api'

dayjs.extend(relativeTime)

interface Props {
  vmsIds: number[]
}

const relativeSince = (iso?: string) => {
  if (!iso) return '—'
  const d = dayjs(iso)
  if (!d.isValid()) return '—'
  return d.locale('th').fromNow()
}

const LiveMonitor: React.FC<Props> = React.memo(function LiveMonitor({ vmsIds }) {
  const { data, isLoading, isFetching, dataUpdatedAt } = useCommandCenterMonitor(vmsIds, { refetchIntervalMs: 5_000 })
  const rows: VMSMonitorItem[] = data?.data ?? []
  const cancel = useCancelVMSSetting()
  const { message } = App.useApp()
  const [drawer, setDrawer] = useState<{ cmi?: string; name?: string; wid?: number; open: boolean }>({ open: false })

  const openHistory = (item: VMSMonitorItem) => {
    setDrawer({
      open: true,
      cmi: item.crossing_master_index,
      name: item.solution_name,
      wid: item.wid,
    })
  }

  const closeDrawer = () => setDrawer((s) => ({ ...s, open: false }))

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">ติดตามสถานะแบบเรียลไทม์</div>
          <div className="text-xs opacity-60 mt-0.5">
            อัพเดตอัตโนมัติทุก 5 วินาที · ล่าสุด {lastUpdatedRel}{' '}
            {isFetching && <span className="opacity-70">(กำลังโหลด...)</span>}
          </div>
        </div>
        <Badge count={rows.length} showZero color="#f59e0b" overflowCount={999} />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {vmsIds.length === 0 && <Empty description="เลือกป้ายจากคอลัมน์ซ้ายเพื่อเริ่มติดตาม" />}
        {vmsIds.length > 0 && isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
        {vmsIds.length > 0 && !isLoading && rows.length === 0 && (
          <Empty description="ไม่มีข้อมูลป้ายที่เลือก" />
        )}
        {rows.map((it) => {
          const meta = statusMeta(it.status ?? undefined)
          const hasActive = it.setting_id != null
          return (
            <div
              key={it.vms_id}
              className="rounded-lg border border-white/10 bg-white/[.04] p-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{it.solution_name || `VMS ${it.vms_id}`}</div>
                  <div className="text-xs opacity-60">
                    WID {it.wid} · vms_id {it.vms_id}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip
                    title={
                      <div className="text-xs">
                        <div>เชื่อมต่อ: {it.is_online ? 'ออนไลน์' : 'ออฟไลน์'}</div>
                        <div>last_seen: {it.last_seen_at ?? '—'}</div>
                      </div>
                    }
                  >
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
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
                </div>
              </div>

              {hasActive && (
                <div className="mt-2 flex items-center gap-3">
                  {it.media_url ? (
                    <div className="w-16 h-16 rounded overflow-hidden bg-black/30 flex-shrink-0">
                      <Image
                        src={it.media_url}
                        alt=""
                        width={64}
                        height={64}
                        preview={false}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 text-xs opacity-80">
                    <div>
                      <b>{it.setting_type_name || '-'}</b> · setting #{it.setting_id}
                    </div>
                    <div className="opacity-70">
                      {it.date_since} → {it.date_to}
                    </div>
                    {it.message && <div className="opacity-70 truncate">{it.message}</div>}
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 justify-end">
                <Button
                  size="small"
                  icon={<TbHistory style={{ verticalAlign: -2 }} />}
                  onClick={() => openHistory(it)}
                >
                  ประวัติ
                </Button>
                {hasActive && meta.isCancellable && (
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
                )}
              </div>
            </div>
          )
        })}
      </div>
      <HistoryDrawer
        open={drawer.open}
        onClose={closeDrawer}
        crossingMasterIndex={drawer.cmi}
        solutionName={drawer.name}
        wid={drawer.wid}
      />
    </div>
  )
})

export default LiveMonitor
