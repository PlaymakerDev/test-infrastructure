"use client"
import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider, DatePicker, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import { TbPrinter } from 'react-icons/tb'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { useLightingLogs4gCentral } from '@/hooks/queries/lighting'
import type { Logs4gCentralItem, Logs4gCircuitStatus } from '@/types/lighting'
import { useDetailContext } from '../context'
import Pill from './Pill'
import ExportFileModal from '@/components/export/ExportFileModal'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// Map each backend data_type to a display label + color, matching the
// original MonitorSection event-type colors.
const DATA_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  line_check: { label: 'Line Check', color: '#F0FF66' },
  FMTS: { label: 'FMTS', color: '#FF668A' },
  UPS1: { label: 'UPS1', color: '#FF668A' },
  UPS2: { label: 'UPS2', color: '#FF668A' },
  UPS3: { label: 'UPS3', color: '#FF668A' },
  volt_amp: { label: 'Volt/Amp', color: '#66AEFF' },
  circuit: { label: 'Circuit', color: '#8FFF66' },
}

// eventCategory for the segmented filter — derived from data_type. Values
// The API exposes UPS and FMTS only as one server-side `etc` category. Keep
// them combined so pagination totals always describe the rows being shown.
type EventCategory = 'ALL' | 'line_check' | 'volt_amp' | 'circuit' | 'etc'
const EVENT_TYPE_OPTIONS: { label: string; value: EventCategory }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'Line Check', value: 'line_check' },
  { label: 'Volt/Amp', value: 'volt_amp' },
  { label: 'Circuit', value: 'circuit' },
  { label: 'UPS / FMTS', value: 'etc' },
]

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'
const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวาน', value: 'YESTERDAY' },
  { label: '7 วัน', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
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

// Plain-text twin of renderStatus for the นำออกเอกสาร export (PDF/Excel can't
// render the on-screen badge groups, so flatten each data_type's status shape
// into one readable string using the same field labels as the screen).
const formatStatusForExport = (r: Logs4gCentralItem): string => {
  const { status } = r
  switch (r.data_type) {
    case 'line_check': {
      const checks = Array.isArray(status) ? status : []
      const label = (c: number | null) => (c === 1 ? 'OK' : c === 0 ? 'FAIL' : '-')
      return checks.map((c, i) => `L${i + 1}:${label(c)}`).join(' ')
    }
    case 'circuit': {
      if (!isCircuitStatus(status)) return '-'
      const fields: [string, number | null][] = [
        ['ST', status.ST], ['MB', status.MB], ['PS', status.PS],
        ['MC1', status.MC1], ['MC2', status.MC2],
        ['CB1', status.CB1], ['CB2', status.CB2], ['CB3', status.CB3], ['CB4', status.CB4],
        ['TFM', status.TFM],
      ]
      return fields.map(([key, value]) => `${key}:${value ?? '-'}`).join(' ')
    }
    default:
      return typeof status === 'string' ? status : '-'
  }
}

// Shared column config for both PDF and Excel exports — same columns/order as
// the on-screen table. `width` = Excel chars, `widthPct` = PDF percent (sums 100).
const MONITOR_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (r: Logs4gCentralItem) => string | number
}[] = [
  { header: 'วันที่และเวลา', width: 22, widthPct: 22, value: (r) => dayjs(r.created_at, 'YYYY-MM-DD HH:mm:ss').format('DD MMM BBBB HH:mm:ss') },
  { header: 'ประเภท', width: 14, widthPct: 18, value: (r) => DATA_TYPE_LABELS[r.data_type]?.label ?? r.data_type },
  { header: 'Phase', width: 8, widthPct: 10, value: (r) => r.phase ?? '-' },
  { header: 'สถานะ', width: 40, widthPct: 50, align: 'left', value: (r) => formatStatusForExport(r) },
]

type PeriodBounds = [Dayjs, Dayjs] | null

const periodToBounds = (p: PeriodFilter): PeriodBounds => {
  const now = dayjs()
  switch (p) {
    case 'TODAY': return [now.startOf('day'), now.endOf('day')]
    case 'YESTERDAY': { const y = now.subtract(1, 'day'); return [y.startOf('day'), y.endOf('day')] }
    case 'LAST_7_DAYS': return [now.subtract(6, 'day').startOf('day'), now.endOf('day')]
    case 'THIS_MONTH': return [now.startOf('month'), now.endOf('month')]
  }
}

const MonitorSection: React.FC = () => {
  const { imei } = useDetailContext()
  const [eventType, setEventType] = useState<EventCategory>('ALL')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>('TODAY')
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const pageSize = 50

  // Explicit date-range picker wins over the period preset when both are set;
  // Without a picker, use an explicit preset range rather than relying on
  // the endpoint's implicit today-only default.
  const effectiveRange: PeriodBounds = useMemo(() => {
    const [pickerStart, pickerEnd] = dateRange ?? [null, null]
    if (pickerStart || pickerEnd) {
      return [pickerStart?.startOf('day') ?? periodToBounds(period)?.[0] ?? dayjs().startOf('day'),
        pickerEnd?.endOf('day') ?? periodToBounds(period)?.[1] ?? dayjs().endOf('day')]
    }
    return periodToBounds(period)
  }, [dateRange, period])

  const dataTypeParam: 'circuit' | 'line_check' | 'volt_amp' | 'etc' | undefined =
    eventType === 'ALL' ? undefined : eventType

  const logsQuery = useLightingLogs4gCentral(imei, {
    start_date: effectiveRange?.[0].format('YYYY-MM-DD'),
    end_date: effectiveRange?.[1].format('YYYY-MM-DD'),
    data_type: dataTypeParam,
    page,
    limit: pageSize,
  })
  const records = logsQuery.data?.res_data ?? []
  const loaded = !logsQuery.isLoading
  const totalCount = logsQuery.data?.meta_data?.count ?? 0

  // "ทั้งหมด" export scope — the on-screen table only ever holds one page
  // (pageSize=50), so fetch the full filtered set separately at export time
  // rather than paging through it client-side.
  const fetchAllRecordsForExport = async (): Promise<Logs4gCentralItem[]> => {
    if (totalCount === 0) return []
    const { getLightingLogs4gCentralAPI } = await import('@/services/routes/LightingService')
    const res = await getLightingLogs4gCentralAPI(imei, {
      start_date: effectiveRange?.[0].format('YYYY-MM-DD'),
      end_date: effectiveRange?.[1].format('YYYY-MM-DD'),
      data_type: dataTypeParam,
      page: 1,
      limit: totalCount,
    })
    return res.data.res_data ?? []
  }

  // `_rowKey` disambiguates records that share created_at/data_type/phase —
  // the backend can log more than one reading within the same second.
  const filteredRecords = useMemo(() => {
    return records.map((record, index) => ({
      ...record,
      _rowKey: `${record.created_at}-${record.data_type}-${record.phase}-${index}`,
    }))
  }, [records])

  const columns: ColumnsType<Logs4gCentralItem & { _rowKey: string }> = useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'created_at',
        key: 'created_at',
        align: 'center',
        width: 180,
        render: (t: string) => <span className='text-white'>{dayjs(t, 'YYYY-MM-DD HH:mm:ss').format('DD MMM BBBB HH:mm:ss')}</span>,
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
      <h3 className='text-[#FCD116] text-base sm:text-lg m-0' style={{ fontWeight: 400 }}>
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
                onChange={(dates) => {
                  setDateRange(dates)
                  setPage(1)
                }}
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
              onChange={(value) => {
                setPeriod(value as PeriodFilter)
                setPage(1)
              }}
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
                onChange={(value) => {
                  setEventType(value as EventCategory)
                  setPage(1)
                }}
                options={EVENT_TYPE_OPTIONS}
                size='middle'
                classNames={SEGMENTED_CLASS_NAMES}
              />
            </div>
          </div>

          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              type='primary'
              shape='round'
              icon={<TbPrinter />}
              style={{ height: 40 }}
              className='shrink-0'
              onClick={() => setExportOpen(true)}
            >
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
        </div>
      </div>

      {/* นำออกเอกสาร — "ทั้งหมด" fetches the full filtered set separately
          (fetchAllRecordsForExport); "หน้าปัจจุบัน" exports the loaded page. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount, pageCount: filteredRecords.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? filteredRecords : await fetchAllRecordsForExport()
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Lighting_Monitor_Log',
            title: 'รายงานตารางแสดงรายละเอียดและการทำงานของตู้ควบคุมไฟ (Log)',
            columns: MONITOR_EXPORT_COLUMNS,
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const rows = scope === 'page' ? filteredRecords : await fetchAllRecordsForExport()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Lighting_Monitor_Log',
            sheetName: 'Monitor Log',
            title: 'รายงานตารางแสดงรายละเอียดและการทำงานของตู้ควบคุมไฟ (Log)',
            columns: MONITOR_EXPORT_COLUMNS,
            rows,
          })
        }}
      />

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<Logs4gCentralItem & { _rowKey: string }>
          rowKey='_rowKey'
          columns={columns}
          dataSource={filteredRecords}
          loading={logsQuery.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: logsQuery.data?.meta_data?.count ?? 0,
            showSizeChanger: false,
            onChange: setPage,
          }}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{
            emptyText: logsQuery.isError
              ? 'ไม่สามารถโหลดข้อมูลได้'
              : loaded ? 'ไม่พบข้อมูล' : 'กำลังโหลด...',
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(MonitorSection)
