"use client"
import React, { useMemo, useState } from 'react'
import { Badge, Button, ConfigProvider, DatePicker, Empty, Segmented, Skeleton, Table, Tooltip } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import { TbCalendar, TbEye, TbRefresh } from 'react-icons/tb'
import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { useGlobalHistory } from '../hooks/useGlobalHistory'
import StatusPill from './StatusPill'
import { statusMeta, sourceLabel } from '../constants/vmsStatus'
import type { VMSGlobalHistoryItem } from '@/types/vms/command-center-api'

dayjs.extend(relativeTime)
// `BBBB` (Buddhist-Era year) for the custom-range picker's Thai display.
dayjs.extend(buddhistEra)

// Same preset set + wording as crosswalk detail tab 2 (FormSearchViolation):
// วันนี้ / เมื่อวานนี้ / 7 วันที่ผ่านมา / เดือนนี้; 'custom' = the user picked
// dates in the RangePicker (no pill highlighted, like crosswalk's ALL).
type RangePreset = 'today' | 'yesterday' | '7d' | 'month' | 'custom'

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
      case 'yesterday': {
        const y = today.subtract(1, 'day')
        return { from: y.format('YYYY-MM-DD'), to: y.format('YYYY-MM-DD') }
      }
      case '7d':
        return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
      case 'month':
        return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
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
              <div className="fs-12">{d.format('DD MMM HH:mm:ss')}</div>
              <div className="fs-12 text-white/50">{d.locale('th').fromNow()}</div>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: 'ป้าย / สายทาง / STA',
      key: 'sign',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="fs-12 truncate flex items-center gap-1.5">
            {r.road_code && <span className="text-(--yellow) font-semibold">{r.road_code}</span>}
            {r.sta && <span className="text-(--default-blue) fs-12">กม.{r.sta}</span>}
            <span className="truncate opacity-80">{r.solution_name || `WID ${r.wid ?? '?'}`}</span>
          </div>
          <div className="fs-12 text-white/50">
            WID {r.wid ?? '—'} · {r.command_no != null ? `คำสั่งที่ ${r.command_no}` : `setting #${r.setting_id}`}
          </div>
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
              <span className="text-white/40">→</span>
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
      render: (s: string) => <span className="fs-12">{sourceLabel(s)}</span>,
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
    <>
      <div className="flex flex-col h-full bg-(--dark-black) rounded-xl overflow-hidden text-white/90">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-wrap">
          <div className="fs-12 font-semibold text-(--yellow)">ประวัติสั่งงานทั้งหมด</div>
          {/* Same date-filter look + wording as crosswalk detail tab 2
              (FormSearchViolation): yellow-bordered Segmented pills + Thai
              Buddhist-era RangePicker, always visible and reflecting the
              active preset's range; picking dates manually un-highlights the
              pills ('custom', like crosswalk's ALL). Data behaviour
              unchanged. */}
          <Segmented
            value={preset}
            onChange={(v) => {
              const next = v as typeof preset
              // Entering กำหนดเอง always starts fresh: clear the range so the
              // picker shows its placeholders and the user picks new dates
              // (re-entering after another preset must reset, not remember).
              if (next === 'custom') setCustomRange(null)
              setPreset(next)
            }}
            options={[
              { label: 'วันนี้', value: 'today' },
              { label: 'เมื่อวานนี้', value: 'yesterday' },
              { label: '7 วันที่ผ่านมา', value: '7d' },
              { label: 'เดือนนี้', value: 'month' },
              { label: 'กำหนดเอง', value: 'custom' },
            ]}
            classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
          />
          <ConfigProvider locale={thTH}>
            <DatePicker.RangePicker
              value={[from ? dayjs(from) : null, to ? dayjs(to) : null]}
              onChange={(v) => {
                if (v && v[0] && v[1]) {
                  setCustomRange([v[0], v[1]])
                  setPreset('custom')
                }
              }}
              placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
              format='D MMM BBBB'
              className='w-72!'
              separator={<span className='text-white'>-</span>}
              suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
            />
          </ConfigProvider>
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
              // `defaultPageSize`, not `pageSize` — the fixed prop overrode
              // every size the user picked, so the 20/50/100 dropdown looked
              // dead (reported 2026-07-27).
              pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
              scroll={{ x: 900 }}
              onRow={(r) => ({ onClick: () => r.vms_id && onOpenSign(r.vms_id), style: { cursor: r.vms_id ? 'pointer' : 'default' } })}
            />
          )}
        </div>
      </div>
    </>
  )
})

export default GlobalHistoryTable
