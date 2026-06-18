"use client"
import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider, DatePicker, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbPrinter } from 'react-icons/tb'
import useIsMobile from '@/utils/hooks/useIsMobile'
import Pill from './Pill'
import {
  CONTROL_CABINET_LOGS,
  EVENT_TYPE_COLORS,
  type CabinetLogEventCategory,
  type ControlCabinetLogRecord,
} from '../data/controlCabinetLogs'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const { RangePicker } = DatePicker

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL'
type EventTypeFilter = 'ALL' | CabinetLogEventCategory

const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวาน', value: 'YESTERDAY' },
  { label: '7 วัน', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const EVENT_TYPE_OPTIONS: { label: string; value: EventTypeFilter }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'Circuit', value: 'CIRCUIT' },
  { label: 'Line Check', value: 'LINE_CHECK' },
  { label: 'Volt/Amp', value: 'VOLT_AMP' },
  { label: 'อื่นๆ', value: 'OTHER' },
]

const DEFAULT_DATE = dayjs('2026-04-20')

const FILTER_LABEL_CLASS = 'block fs-12 text-(--yellow)'
const FILTER_BOX_CLASS =
  'monitor-filter-box box-border flex items-center rounded-[10px] border border-(--yellow) bg-[#1A1A1A] px-1 py-0.5 h-[40px]'
const SEGMENTED_CLASS_NAMES = {
  root: 'min-w-max border-0! shadow-none! bg-transparent! p-0!',
} as const
const FILTER_SCROLL_CLASS =
  'overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const STATUS_BADGE_CLASS =
  'inline-flex items-center justify-center w-[45px] h-[20px] rounded-[88px] border box-border text-[10px] whitespace-nowrap'

const OkPill = ({ label }: { label: string }) => (
  <span
    className={`${STATUS_BADGE_CLASS} font-medium`}
    style={{ borderColor: '#4CE99A', color: '#4CE99A' }}
  >
    {label}
  </span>
)

const CircuitBadge = ({
  label,
  color,
  variant,
}: {
  label: string
  color: string
  variant: 'outline' | 'filled'
}) => (
  <span
    className={`${STATUS_BADGE_CLASS} font-semibold`}
    style={
      variant === 'filled'
        ? { background: color, borderColor: color, color: '#212121' }
        : { borderColor: color, color }
    }
  >
    {label}
  </span>
)

const StatusCell = ({ status }: { status: ControlCabinetLogRecord['status'] }) => {
  switch (status.kind) {
    case 'ok_pills':
      return (
        <div className='flex flex-wrap items-center justify-center gap-1'>
          {status.labels.map((label, i) => (
            <OkPill key={`${label}-${i}`} label={label} />
          ))}
        </div>
      )
    case 'voltage':
      return <span className='text-[#FCD116]'>{status.value}</span>
    case 'circuit_badges':
      return (
        <div className='flex flex-wrap items-center justify-center gap-1 max-w-[360px] mx-auto'>
          {status.badges.map((badge) => (
            <CircuitBadge
              key={badge.label}
              label={badge.label}
              color={badge.color}
              variant={badge.variant}
            />
          ))}
        </div>
      )
    case 'empty':
      return null
    default:
      return null
  }
}

const DataCell = ({ data }: { data: ControlCabinetLogRecord['data'] }) => (
  <span style={{ color: data.color === 'yellow' ? '#FCD116' : '#FFFFFF' }}>{data.value}</span>
)

const MonitorSection: React.FC = () => {
  const isMobile = useIsMobile()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    DEFAULT_DATE,
    DEFAULT_DATE,
  ])
  const [period, setPeriod] = useState<PeriodFilter>('TODAY')
  const [eventType, setEventType] = useState<EventTypeFilter>('ALL')

  const filteredLogs = useMemo(() => {
    if (eventType === 'ALL') return CONTROL_CABINET_LOGS
    return CONTROL_CABINET_LOGS.filter((row) => row.eventCategory === eventType)
  }, [eventType])

  const columns: ColumnsType<ControlCabinetLogRecord> = useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'datetime',
        key: 'datetime',
        align: 'center',
        width: 180,
      },
      {
        title: 'ประเภท',
        dataIndex: 'eventType',
        key: 'eventType',
        align: 'center',
        width: 110,
        render: (value: string) => (
          <Pill text={value} color={EVENT_TYPE_COLORS[value] ?? '#979797'} />
        ),
      },
      {
        title: 'Phase',
        dataIndex: 'phase',
        key: 'phase',
        align: 'center',
        width: 70,
        render: (value: string) => <span className='text-white'>{value}</span>,
      },
      {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 300,
        render: (status: ControlCabinetLogRecord['status']) => <StatusCell status={status} />,
      },
      {
        title: 'Data 1-2',
        dataIndex: 'data',
        key: 'data',
        align: 'center',
        width: 180,
        render: (data: ControlCabinetLogRecord['data']) => <DataCell data={data} />,
      },
    ],
    [],
  )

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
        .monitor-filter-date .ant-picker-active-bar {
          display: none !important;
        }
        .monitor-filter-date .ant-picker-suffix {
          color: #fcd116 !important;
          margin-inline-start: 4px;
        }
        .monitor-filter-segmented .ant-segmented {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .monitor-filter-segmented .ant-segmented-group {
          gap: 4px;
        }
        .monitor-filter-segmented .ant-segmented-item {
          border-radius: 5px !important;
        }
        .monitor-filter-segmented .ant-segmented-item-selected {
          border-radius: 5px !important;
        }
        .monitor-filter-segmented .ant-segmented-thumb {
          border-radius: 5px !important;
        }
        .monitor-filter-segmented .ant-segmented-item-label {
          min-height: 32px !important;
          line-height: 32px !important;
          padding: 0 10px !important;
          font-size: 14px !important;
        }
      `}</style>

      <div className={`flex items-end gap-4 flex-nowrap ${FILTER_SCROLL_CLASS}`}>
        <div className='flex flex-col gap-1 shrink-0'>
          <span className={FILTER_LABEL_CLASS}>วันที่แสดงข้อมูล</span>
          <div className={`${FILTER_BOX_CLASS} monitor-filter-date w-[268px] shrink-0`}>
            <ConfigProvider locale={thTH}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format='D MMM BBBB'
                size='middle'
                allowClear={false}
                className='w-full!'
                placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
              />
            </ConfigProvider>
          </div>
        </div>

        <div className='flex flex-col gap-1 shrink-0'>
          <span className={FILTER_LABEL_CLASS}>ช่วงเวลา</span>
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
            <span className={FILTER_LABEL_CLASS}>ประเภทเหตุการณ์</span>
            <div className={`${FILTER_BOX_CLASS} monitor-filter-segmented`}>
              <Segmented
                value={eventType}
                onChange={(value) => setEventType(value as EventTypeFilter)}
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
        <Table<ControlCabinetLogRecord>
          rowKey='key'
          columns={columns}
          dataSource={filteredLogs}
          pagination={false}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{ emptyText: 'ไม่พบข้อมูล' }}
        />
      </div>
    </div>
  )
}

export default React.memo(MonitorSection)
