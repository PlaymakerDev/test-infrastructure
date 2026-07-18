"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, DatePicker, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbPrinter } from 'react-icons/tb'
import { getLightingLogs4gCentralAPI } from '@/services/routes/LightingService'
import type { Logs4gCentralItem, Logs4gCircuitStatus } from '@/types/lighting'
import { useDetailContext } from '../context'
import Pill from './Pill'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// Map each backend data_type to a display label + color, matching the
// original MonitorSection event-type colors.
const DATA_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  line_check: { label: 'Line Check', color: '#FCD116' },
  FMTS: { label: 'FMTS', color: '#E94C4C' },
  UPS1: { label: 'UPS1', color: '#E94C4C' },
  UPS2: { label: 'UPS2', color: '#E94C4C' },
  UPS3: { label: 'UPS3', color: '#E94C4C' },
  volt_amp: { label: 'Volt/Amp', color: '#66AEFF' },
  circuit: { label: 'Circuit', color: '#05F2DB' },
}

// eventCategory for the segmented filter — derived from data_type. Values
// match the API's `data_type` enum directly except UPS/FMTS, which the API
// only exposes bundled together as `etc` (see fetch effect below).
type EventCategory = 'ALL' | 'line_check' | 'volt_amp' | 'circuit' | 'UPS' | 'FMTS'
const EVENT_TYPE_OPTIONS: { label: string; value: EventCategory }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'Line Check', value: 'line_check' },
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
  { label: 'ทั้งหมด', value: 'ALL' },
]

const STATUS_BADGE_CLASS =
  'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap border box-border'

const isCircuitStatus = (s: Logs4gCentralItem['status']): s is Logs4gCircuitStatus =>
  typeof s === 'object' && s !== null && !Array.isArray(s)

// Render a status cell per data_type — the new /logs4g/central endpoint
// bundles everything into one `status` field (shape depends on data_type).
const renderStatus = (r: Logs4gCentralItem) => {
  const { status } = r
  switch (r.data_type) {
    case 'line_check': {
      // array of 8 (int|null) — convention: 1 = ok, 0 = fail, null = no reading.
      // Shown individually (not aggregated) as two groups of 4 (line_detect1-4
      // / line_detect5-8) separated by a divider, per line_detect1..8 pairing.
      const checks = Array.isArray(status) ? status : []
      const label = (c: number | null) => (c === 1 ? 'OK' : c === 0 ? 'FAIL' : '-')
      const color = (c: number | null) => (c === 1 ? '#4CE99A' : c === 0 ? '#E94C4C' : '#979797')
      const renderGroup = (group: (number | null)[], keyPrefix: string) =>
        group.map((c, i) => (
          <span key={`${keyPrefix}${i}`} className={STATUS_BADGE_CLASS} style={{ borderColor: color(c), color: color(c) }}>{label(c)}</span>
        ))
      const divider = (key: string) => <span key={key} style={{ width: 2, height: 26, background: '#ffffff', flexShrink: 0 }} />
      return (
        <div className='flex flex-wrap items-center justify-center gap-1.5'>
          {divider('l')}
          {renderGroup(checks.slice(0, 4), 'a')}
          {divider('m')}
          {renderGroup(checks.slice(4, 8), 'b')}
          {divider('r')}
        </div>
      )
    }
    case 'volt_amp':
      return <span style={{ color: '#FCD116' }}>{typeof status === 'string' ? status : '-'}</span>
    case 'circuit': {
      if (!isCircuitStatus(status)) return <span style={{ color: '#05F2DB' }}>-</span>
      // TFM is always purple regardless of value; every other field is
      // colored by value: 1 = blue, 0 = red, null = gray.
      const fieldColor = (key: string, value: number | null) =>
        key === 'TFM' ? '#CF66FF' : value === 1 ? '#66AEFF' : value === 0 ? '#E94C4C' : '#979797'
      const fields: [string, number | null][] = [
        ['ST', status.ST], ['MB', status.MB], ['PS', status.PS],
        ['MC1', status.MC1], ['MC2', status.MC2],
        ['CB1', status.CB1], ['CB2', status.CB2], ['CB3', status.CB3], ['CB4', status.CB4],
        ['TFM', status.TFM],
      ]
      return (
        <div className='flex flex-wrap items-center justify-center gap-1.5'>
          {fields.map(([key, value]) => (
            <span key={key} className={STATUS_BADGE_CLASS} style={{ borderColor: fieldColor(key, value), color: fieldColor(key, value) }}>
              {key}
            </span>
          ))}
        </div>
      )
    }
    case 'FMTS':
      return <span style={{ color: '#E94C4C' }}>{typeof status === 'string' ? status : '-'}</span>
    case 'UPS1':
    case 'UPS2':
    case 'UPS3':
      return <span className='text-white'>{typeof status === 'string' ? status : '-'}</span>
    default:
      return <span className='text-white/70'>{typeof status === 'string' ? status : '-'}</span>
  }
}

type PeriodBounds = [Dayjs, Dayjs] | null

const periodToBounds = (p: PeriodFilter): PeriodBounds => {
  const now = dayjs()
  switch (p) {
    case 'TODAY': return [now.startOf('day'), now.endOf('day')]
    case 'YESTERDAY': { const y = now.subtract(1, 'day'); return [y.startOf('day'), y.endOf('day')] }
    case 'LAST_7_DAYS': return [now.subtract(6, 'day').startOf('day'), now.endOf('day')]
    case 'THIS_MONTH': return [now.startOf('month'), now.endOf('month')]
    case 'THIS_YEAR': return [now.startOf('year'), now.endOf('year')]
    case 'ALL': return null
  }
}

const MonitorSection: React.FC = () => {
  const { imei } = useDetailContext()
  const [records, setRecords] = useState<Logs4gCentralItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [eventType, setEventType] = useState<EventCategory>('ALL')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>('ALL')

  // Explicit date-range picker wins over the period preset when both are set;
  // ALL + no picker → omit both dates (API defaults to "today", matching the
  // old endpoint's implicit today-only behavior).
  const effectiveRange: PeriodBounds = useMemo(() => {
    const [pickerStart, pickerEnd] = dateRange ?? [null, null]
    if (pickerStart || pickerEnd) {
      return [pickerStart?.startOf('day') ?? periodToBounds(period)?.[0] ?? dayjs().startOf('day'),
        pickerEnd?.endOf('day') ?? periodToBounds(period)?.[1] ?? dayjs().endOf('day')]
    }
    return periodToBounds(period)
  }, [dateRange, period])

  // The API only exposes UPS1/UPS2/UPS3 and FMTS bundled together as `etc` —
  // request that and split them apart client-side for the UPS/FMTS tabs.
  const dataTypeParam: 'circuit' | 'line_check' | 'volt_amp' | 'etc' | undefined =
    eventType === 'ALL' ? undefined
      : eventType === 'UPS' || eventType === 'FMTS' ? 'etc'
        : eventType

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    setLoaded(false)
    const start_date = effectiveRange?.[0].format('YYYY-MM-DD')
    const end_date = effectiveRange?.[1].format('YYYY-MM-DD')

    // Single request, no pagination params — flat table shows whatever the
    // backend's own default page/limit returns.
    getLightingLogs4gCentralAPI(imei, { start_date, end_date, data_type: dataTypeParam })
      .then((res) => { if (active) setRecords(res.data?.res_data ?? []) })
      .catch((err) => console.error('logs4g/central failed:', err))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei, effectiveRange, dataTypeParam])

  // UPS/FMTS split out of the combined `etc` response (see dataTypeParam above).
  // `_rowKey` disambiguates records that share created_at/data_type/phase —
  // the backend can log more than one reading within the same second.
  const filteredRecords = useMemo(() => {
    const base = eventType === 'UPS' ? records.filter((r) => r.data_type === 'UPS1' || r.data_type === 'UPS2' || r.data_type === 'UPS3')
      : eventType === 'FMTS' ? records.filter((r) => r.data_type === 'FMTS')
        : records
    return base.map((r, i) => ({ ...r, _rowKey: `${r.created_at}-${r.data_type}-${r.phase}-${i}` }))
  }, [records, eventType])

  const columns: ColumnsType<Logs4gCentralItem & { _rowKey: string }> = useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'created_at',
        key: 'created_at',
        align: 'center',
        width: 180,
        render: (t: string) => <span className='text-white'>{dayjs(t, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/BBBB HH:mm:ss')}</span>,
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
        render: (p: number | null) => <span className='text-white'>{p ?? '-'}</span>,
      },
      {
        title: 'สถานะ',
        key: 'status',
        align: 'center',
        width: 280,
        render: (_: unknown, r: Logs4gCentralItem) => renderStatus(r),
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
        <Table<Logs4gCentralItem & { _rowKey: string }>
          rowKey='_rowKey'
          columns={columns}
          dataSource={filteredRecords}
          pagination={false}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{ emptyText: loaded ? 'ไม่พบข้อมูล' : 'กำลังโหลด...' }}
        />
      </div>
    </div>
  )
}

export default React.memo(MonitorSection)
