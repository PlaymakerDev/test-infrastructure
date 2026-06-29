"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, DatePicker, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbPrinter } from 'react-icons/tb'
import { getLightingLogs4gAPI } from '@/services/routes/LightingService'
import type { Logs4gRecord } from '@/types/lighting'
import { useDetailContext } from '../context'
import Pill from './Pill'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// Map each backend data_type to a display label + color, matching the
// original MonitorSection event-type colors.
const DATA_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  'line-check': { label: 'Line Check', color: '#FCD116' },
  FMTS: { label: 'FMTS', color: '#E94C4C' },
  UPS1: { label: 'UPS1', color: '#E94C4C' },
  UPS2: { label: 'UPS2', color: '#E94C4C' },
  'volt_amp': { label: 'Volt/Amp', color: '#66AEFF' },
  circuit: { label: 'Circuit', color: '#05F2DB' },
}

// eventCategory for the segmented filter — derived from data_type.
type EventCategory = 'ALL' | 'line-check' | 'volt_amp' | 'circuit' | 'UPS' | 'FMTS'
const EVENT_TYPE_OPTIONS: { label: string; value: EventCategory }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'Line Check', value: 'line-check' },
  { label: 'Volt/Amp', value: 'volt_amp' },
  { label: 'Circuit', value: 'circuit' },
  { label: 'UPS', value: 'UPS' },
  { label: 'FMTS', value: 'FMTS' },
]

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL'
const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวาน', value: 'YESTERDAY' },
  { label: '7 วัน', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const STATUS_BADGE_CLASS =
  'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap border box-border'

// Render a status cell per data_type. line-check → ok/fail pills; others →
// the key values (f/g/h) joined; volt_amp shows Volt/Amp.
const renderStatus = (r: Logs4gRecord) => {
  switch (r.data_type) {
    case 'line-check': {
      const checks = [r.line_detect1, r.line_detect2, r.line_detect3, r.line_detect4,
      r.line_detect5, r.line_detect6, r.line_detect7, r.line_detect8]
      const ok = checks.filter((c) => c === 'ok').length
      const fail = checks.filter((c) => c === 'fail').length
      return (
        <div className='flex flex-wrap items-center justify-center gap-1'>
          {ok > 0 && <span className={STATUS_BADGE_CLASS} style={{ borderColor: '#4CE99A', color: '#4CE99A' }}>OK ×{ok}</span>}
          {fail > 0 && <span className={STATUS_BADGE_CLASS} style={{ borderColor: '#E94C4C', color: '#E94C4C' }}>Fail ×{fail}</span>}
        </div>
      )
    }
    case 'volt_amp':
      return (
        <span style={{ color: '#66AEFF' }}>
          {r.f}V / {r.g}A
        </span>
      )
    case 'circuit':
      return <span style={{ color: '#05F2DB' }}>{r.f} / {r.g}</span>
    case 'FMTS':
      return <span style={{ color: '#E94C4C' }}>Err: {r.i}</span>
    case 'UPS1':
    case 'UPS2':
      return <span className='text-white'>{r.f} {r.g}</span>
    default:
      return <span className='text-white/70'>{r.f} {r.g}</span>
  }
}

const MonitorSection: React.FC = () => {
  const { imei } = useDetailContext()
  const [records, setRecords] = useState<Logs4gRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [eventType, setEventType] = useState<EventCategory>('ALL')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>('ALL')

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    getLightingLogs4gAPI(imei)
      .then((res) => { if (active) setRecords(res.data ?? []) })
      .catch((err) => console.error('logs4g failed:', err))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei])

  // Filter by data_type + date range + period (client-side — the API only
  //  returns today, so older periods simply yield nothing).
  const filteredRecords = useMemo(() => {
    let out = records
    if (eventType !== 'ALL') {
      out = eventType === 'UPS'
        ? out.filter((r) => r.data_type === 'UPS1' || r.data_type === 'UPS2')
        : out.filter((r) => r.data_type === eventType)
    }
    // date_time is "DD/MM/YYYY HH:mm:ss" (Buddhist era). Parse to a comparable.
    const toDayjs = (s: string) => {
      const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
      if (!m) return null
      const [, dd, mm, yyyy] = m
      return dayjs(`${yyyy}-${mm}-${dd}`, 'YYYY-MM-DD')
    }
    if (dateRange && (dateRange[0] || dateRange[1])) {
      out = out.filter((r) => {
        const d = toDayjs(r.date_time)
        if (!d) return false
        if (dateRange[0] && d.isBefore(dateRange[0], 'day')) return false
        if (dateRange[1] && d.isAfter(dateRange[1], 'day')) return false
        return true
      })
    }
    if (period !== 'ALL') {
      const now = dayjs()
      const bounds: [Dayjs, Dayjs] | null =
        period === 'TODAY' ? [now.startOf('day'), now.endOf('day')]
        : period === 'YESTERDAY' ? [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')]
        : period === 'LAST_7_DAYS' ? [now.subtract(6, 'day').startOf('day'), now.endOf('day')]
        : period === 'THIS_MONTH' ? [now.startOf('month'), now.endOf('month')]
        : period === 'THIS_YEAR' ? [now.startOf('year'), now.endOf('year')]
        : null
      if (bounds) {
        out = out.filter((r) => {
          const d = toDayjs(r.date_time)
          if (!d) return false
          return !d.isBefore(bounds[0], 'day') && !d.isAfter(bounds[1], 'day')
        })
      }
    }
    return out
  }, [records, eventType, dateRange, period])

  const columns: ColumnsType<Logs4gRecord> = useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'date_time',
        key: 'date_time',
        align: 'center',
        width: 180,
        render: (t: string) => <span className='text-white'>{t}</span>,
      },
      {
        title: 'ประเภท',
        dataIndex: 'data_type',
        key: 'data_type',
        align: 'center',
        width: 120,
        render: (dt: string) => {
          const meta = DATA_TYPE_LABELS[dt] ?? { label: dt, color: '#979797' }
          return <Pill text={meta.label} color={meta.color} />
        },
      },
      {
        title: 'Phase',
        dataIndex: 'phase',
        key: 'phase',
        align: 'center',
        width: 70,
        render: (p: number) => <span className='text-white'>{p}</span>,
      },
      {
        title: 'สถานะ',
        key: 'status',
        align: 'center',
        width: 280,
        render: (_: unknown, r: Logs4gRecord) => renderStatus(r),
      },
      {
        title: 'Data 1-2',
        key: 'data',
        align: 'center',
        width: 160,
        render: (_: unknown, r: Logs4gRecord) => (
          <span style={{ color: '#FCD116' }}>{r.h} {r.i}</span>
        ),
      },
    ],
    [],
  )

  const FILTER_BOX_CLASS =
    'monitor-filter-box box-border flex items-center rounded-[10px] border border-(--yellow) bg-[#1A1A1A] px-1 py-0.5 h-[40px]'
  const FILTER_SCROLL_CLASS =
    'overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
  const SEGMENTED_CLASS_NAMES = {
    root: 'min-w-max border-0! shadow-none! bg-transparent! p-0!',
  } as const

  return (
    <div className='flex flex-col gap-4 pb-5'>
      <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
        ตารางแสดงรายละเอียดและการทำงานของตู้ควบคุมไฟ (Log)
      </h3>

      <style>{`
        .monitor-filter-date .ant-picker {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          width: 100% !important;
          height: 34px !important;
          padding: 0 4px !important;
        }
        .monitor-filter-date .ant-picker-input > input {
          color: #ffffff !important;
          font-size: 14px !important;
        }
        .monitor-filter-date .ant-picker-active-bar { display: none !important; }
        .monitor-filter-date .ant-picker-suffix { color: #fcd116 !important; margin-inline-start: 4px; }
        .monitor-filter-segmented .ant-segmented {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .monitor-filter-segmented .ant-segmented-group { gap: 4px; }
        .monitor-filter-segmented .ant-segmented-item { border-radius: 5px !important; }
        .monitor-filter-segmented .ant-segmented-item-selected { border-radius: 5px !important; }
        .monitor-filter-segmented .ant-segmented-thumb { border-radius: 5px !important; }
        .monitor-filter-segmented .ant-segmented-item-label {
          min-height: 32px !important; line-height: 32px !important;
          padding: 0 10px !important; font-size: 14px !important;
        }
      `}</style>

      <div className={`flex items-end gap-4 flex-nowrap ${FILTER_SCROLL_CLASS}`}>
        <div className='flex flex-col gap-1 shrink-0'>
          <span className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</span>
          <div className={`${FILTER_BOX_CLASS} monitor-filter-date w-[268px] shrink-0`}>
            <ConfigProvider locale={thTH}>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format='D MMM BBBB'
                size='middle'
                allowClear
                className='w-full!'
                placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
              />
            </ConfigProvider>
          </div>
        </div>

        <div className='flex flex-col gap-1 shrink-0'>
          <span className='block fs-12 text-(--yellow)'>ช่วงเวลา</span>
          <div className={`${FILTER_BOX_CLASS} monitor-filter-segmented`}>
            <Segmented
              value={period}
              onChange={(value) => setPeriod(value as PeriodFilter)}
              options={PERIOD_OPTIONS}
              size='middle'
              classNames={SEGMENTED_CLASS_NAMES}
            />
          </div>
        </div>

        <div className='flex items-end gap-3 shrink-0'>
          <div className='flex flex-col gap-1'>
            <span className='block fs-12 text-(--yellow)'>ประเภทเหตุการณ์</span>
            <div className={`${FILTER_BOX_CLASS} monitor-filter-segmented`}>
              <Segmented
                value={eventType}
                onChange={(value) => setEventType(value as EventCategory)}
                options={EVENT_TYPE_OPTIONS}
                size='middle'
                classNames={SEGMENTED_CLASS_NAMES}
              />
            </div>
          </div>

          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              type='primary'
              size='small'
              icon={<TbPrinter />}
              onClick={() => alert('TODO: นำออกเอกสาร')}
              className='w-[130px]! h-[27px]! rounded-[88px]! px-2! text-xs! inline-flex! items-center! justify-center!'
            >
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
        </div>
      </div>

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<Logs4gRecord>
          rowKey={(r) => `${r.date_time}-${r.data_type}-${r.e ?? ''}`}
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ` }}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{ emptyText: loaded ? 'ไม่พบข้อมูล' : 'กำลังโหลด...' }}
        />
      </div>
    </div>
  )
}

export default React.memo(MonitorSection)
