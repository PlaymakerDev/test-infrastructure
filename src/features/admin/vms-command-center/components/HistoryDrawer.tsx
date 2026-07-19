"use client"
import React from 'react'
import { ConfigProvider, Drawer, Empty, Skeleton, Timeline, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { statusMeta, sourceLabel } from '../constants/vmsStatus'
import { useVMSCrossingHistory } from '@/features/admin/control-vms/overall/hooks/useVMSCrossingHistory'
import StatusPill from './StatusPill'

dayjs.extend(relativeTime)

interface Props {
  open: boolean
  onClose: () => void
  crossingMasterIndex?: string
  solutionName?: string
  wid?: number
}

const HistoryDrawer: React.FC<Props> = ({ open, onClose, crossingMasterIndex, solutionName, wid }) => {
  const { data, isLoading } = useVMSCrossingHistory(crossingMasterIndex, {
    enabled: open,
    refetchIntervalMs: open ? 5_000 : undefined,
    limit: 300,
  })
  const rows = data?.data ?? []

  return (
    <ConfigProvider theme={{ token: { colorTextBase: '#0f172a' } }}>
      <Drawer
        placement="right"
        width={520}
        open={open}
        onClose={onClose}
        title={
          <div>
            <div className="text-base font-semibold text-slate-800">ประวัติสถานะป้าย</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {solutionName ?? '-'} {wid ? `· WID ${wid}` : ''}
            </div>
          </div>
        }
      >
        {isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
        {!isLoading && rows.length === 0 && <Empty description="ยังไม่มีประวัติสถานะ" />}
        {!isLoading && rows.length > 0 && (
          <Timeline
            items={rows.map((r) => {
              const meta = statusMeta(r.status)
              const at = dayjs(r.reported_at)
              const rel = at.locale('th').fromNow()
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
                        <span>{at.format('DD MMM YYYY HH:mm:ss')} · {rel}</span>
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
      </Drawer>
    </ConfigProvider>
  )
}

export default HistoryDrawer
