"use client"
import React, { useMemo, useState } from 'react'
import { Badge, Button, ConfigProvider, DatePicker, Empty, Radio, Skeleton, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbEye, TbRefresh } from 'react-icons/tb'
import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useGlobalHistory } from '../hooks/useGlobalHistory'
import StatusPill from './StatusPill'
import { statusMeta, sourceLabel } from '../constants/vmsStatus'
import type { VMSGlobalHistoryItem } from '@/types/vms/command-center-api'

dayjs.extend(relativeTime)

type RangePreset = 'today' | '7d' | '30d' | 'custom'

interface Props {
  onOpenSign: (vmsId: number) => void
}

const GlobalHistoryTable: React.FC<Props> = React.memo(function GlobalHistoryTable({ onOpenSign }) {
  const [preset, setPreset] = useState<RangePreset>('7d')
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null)

  const { from, to } = useMemo(() => {
    const today = dayjs()
    switch (preset) {
      case 'today':
        return { from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
      case '7d':
        return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
      case '30d':
        return { from: today.subtract(29, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
      case 'custom':
        return customRange
          ? { from: customRange[0].format('YYYY-MM-DD'), to: customRange[1].format('YYYY-MM-DD') }
          : { from: undefined, to: undefined }
    }
  }, [preset, customRange])

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useGlobalHistory({ from, to, limit: 500 })
  const rows: VMSGlobalHistoryItem[] = data?.data ?? []

  const columns: ColumnsType<VMSGlobalHistoryItem> = [
    {
      title: 'เวลา',
      key: 'reported_at',
      width: 190,
      render: (_, r) => {
        const d = dayjs(r.reported_at)
        return (
          <Tooltip title={d.format('YYYY-MM-DD HH:mm:ss.SSS')}>
            <div>
              <div className="text-sm">{d.format('DD MMM HH:mm:ss')}</div>
              <div className="text-xs text-slate-500">{d.locale('th').fromNow()}</div>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: 'ป้าย',
      key: 'sign',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm truncate">{r.solution_name || `WID ${r.wid ?? '?'}`}</div>
          <div className="text-xs text-slate-500">WID {r.wid ?? '—'} · setting #{r.setting_id}</div>
        </div>
      ),
    },
    {
      title: 'เนื้อหา',
      dataIndex: 'setting_type_name',
      key: 'setting_type_name',
      width: 140,
      render: (v?: string) => v || '—',
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 240,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.prev_status != null && r.prev_status !== r.status && (
            <>
              <StatusPill status={r.prev_status} size="sm" />
              <span className="text-slate-400">→</span>
            </>
          )}
          <StatusPill status={r.status} size="sm" />
        </div>
      ),
    },
    {
      title: 'ที่มา',
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (s: string) => <span className="text-xs">{sourceLabel(s)}</span>,
    },
    {
      title: '',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<TbEye style={{ verticalAlign: -2 }} />}
          disabled={!r.vms_id}
          onClick={() => r.vms_id && onOpenSign(r.vms_id)}
        >
          ดูป้าย
        </Button>
      ),
    },
  ]

  const rowCount = rows.length
  const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).locale('th').fromNow() : '—'

  return (
    <ConfigProvider theme={{ token: { colorTextBase: '#0f172a' } }}>
      <div className="flex flex-col h-full bg-white/95 rounded-xl overflow-hidden text-slate-900">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 flex-wrap">
          <div className="text-sm font-semibold">ประวัติสั่งงานทั้งหมด</div>
          <Radio.Group value={preset} onChange={(e) => setPreset(e.target.value)} size="small">
            <Radio.Button value="today">วันนี้</Radio.Button>
            <Radio.Button value="7d">7 วันล่าสุด</Radio.Button>
            <Radio.Button value="30d">30 วัน</Radio.Button>
            <Radio.Button value="custom">กำหนดเอง</Radio.Button>
          </Radio.Group>
          {preset === 'custom' && (
            <DatePicker.RangePicker
              size="small"
              value={customRange ?? undefined}
              onChange={(v) => v && v[0] && v[1] && setCustomRange([v[0], v[1]])}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <Badge count={rowCount} showZero color="#0ea5e9" overflowCount={9999} />
            <Tooltip title={`อัพเดตอัตโนมัติทุก 15 วิ · ล่าสุด ${lastUpdated}`}>
              <Button
                size="small"
                icon={<TbRefresh style={{ verticalAlign: -2 }} />}
                loading={isFetching}
                onClick={() => refetch()}
              >
                รีเฟรช
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : rowCount === 0 ? (
            <Empty description="ไม่มีคำสั่งในช่วงเวลาที่เลือก" />
          ) : (
            <Table<VMSGlobalHistoryItem>
              size="small"
              rowKey="id"
              columns={columns}
              dataSource={rows}
              pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
              scroll={{ x: 900 }}
              onRow={(r) => ({ onClick: () => r.vms_id && onOpenSign(r.vms_id), style: { cursor: r.vms_id ? 'pointer' : 'default' } })}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  )
})

export default GlobalHistoryTable
