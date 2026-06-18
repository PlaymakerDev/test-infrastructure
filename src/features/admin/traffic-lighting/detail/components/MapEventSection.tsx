"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbMapPin } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { useDetailContext } from '../context'
import {
  EVENT_LOGS,
  EVENT_LOG_SUMMARY,
  type EventLogLevel,
  type EventLogLineStatus,
  type EventLogRecord,
} from '../data/eventLogs'

const SUMMARY_STATS = [
  { label: 'ทั้งหมด', value: EVENT_LOG_SUMMARY.total, color: '#FCD116', variant: 'filled' as const },
  { label: 'UP', value: EVENT_LOG_SUMMARY.up, color: '#66AEFF', variant: 'outlined' as const },
  { label: 'DOWN', value: EVENT_LOG_SUMMARY.down, color: '#E94C4C', variant: 'outlined' as const },
]

const LevelBadge = ({ label }: { label: EventLogLevel }) => {
  const color = label === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <span
      className='inline-block px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

const LineStatusBadge = ({ label }: { label: EventLogLineStatus }) => {
  const color = label === 'UP' ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-block px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

/** Map (left) + event log table (right) below the example cards row. */
const MapEventSection: React.FC = () => {
  const { project } = useDetailContext()

  const columns: ColumnsType<EventLogRecord> = React.useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'datetime',
        key: 'datetime',
        align: 'center',
        width: 180,
      },
      {
        title: 'อุปกรณ์',
        dataIndex: 'device',
        key: 'device',
        align: 'center',
        width: 140,
        render: (_value: string, record: EventLogRecord) => (
          <LevelBadge label={record.level} />
        ),
      },
      {
        title: 'เหตุการณ์',
        dataIndex: 'event',
        key: 'event',
        align: 'center',
        width: 220,
        render: (value: string) => (
          <span style={{ color: '#66AEFF' }}>{value}</span>
        ),
      },
      {
        title: 'สถานะ',
        dataIndex: 'lineStatus',
        key: 'lineStatus',
        align: 'center',
        width: 100,
        render: (value: EventLogLineStatus) => <LineStatusBadge label={value} />,
      },
    ],
    [],
  )

  return (
    <div className='flex flex-col lg:flex-row lg:items-start w-full gap-3 mt-4 pb-5'>
      {/* Map */}
      <div
        className='relative w-full lg:w-[45%] xl:w-[42%] shrink-0 min-h-[300px] h-[300px] sm:h-[400px] lg:h-[480px] rounded-[20px] overflow-hidden bg-[#212121]'
      >
        <BaseMap
          style={{ height: '100%', width: '100%' }}
          initialCenter={project.coord}
          initialZoom={16}
          initialPitch={45}
          edgeFade={{ all: 20 }}
        >
          <HTMLMarker lngLat={project.coord} anchor='bottom' title={project.installPoint}>
            <div
              className='flex items-center justify-center'
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#FCD116',
                boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
                border: '2px solid #fff',
              }}
            >
              <TbMapPin size={20} color='#212121' />
            </div>
          </HTMLMarker>
        </BaseMap>
      </div>

      {/* Event table */}
      <div className='flex-1 min-w-0 flex flex-col gap-3'>
        <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
          ตารางข้อมูลรายเหตุการณ์
        </h3>

        <div className='flex flex-row flex-wrap items-center gap-2'>
          {SUMMARY_STATS.map((stat) => (
            <div
              key={stat.label}
              className='box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-[calc(50%-4px)] min-w-[110px] max-w-[130px] sm:w-[130px] h-[46px]'
              style={{
                ...(stat.variant === 'filled'
                  ? { background: stat.color }
                  : { background: 'transparent', border: `2px solid ${stat.color}` }),
              }}
            >
              <span
                className='text-[12px] font-normal m-0 leading-none shrink-0'
                style={{ color: stat.variant === 'filled' ? '#212121' : stat.color }}
              >
                {stat.label}
              </span>
              <span
                className='flex items-center justify-center text-[14px] font-normal m-0 leading-none shrink-0 rounded-[5px]'
                style={{
                  width: 50,
                  height: 30,
                  ...(stat.variant === 'filled'
                    ? { background: '#212121', color: stat.color }
                    : { background: stat.color, color: '#212121' }),
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<EventLogRecord>
            rowKey='key'
            columns={columns}
            dataSource={EVENT_LOGS}
            pagination={false}
            size='middle'
            className='bridge-projects-table event-log-table'
            locale={{ emptyText: 'ไม่พบข้อมูล' }}
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(MapEventSection)
