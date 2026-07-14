"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbMapPin } from 'react-icons/tb'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { getLightingAlertsAPI } from '@/services/routes/LightingService'
import type { AlertItem } from '@/types/lighting'
import { useDetailContext } from '../context'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const SUMMARY_STATS = [
  { label: 'ทั้งหมด', color: '#FCD116', variant: 'filled' as const },
  { label: 'UP', color: '#66AEFF', variant: 'outlined' as const },
  { label: 'DOWN', color: '#E94C4C', variant: 'outlined' as const },
]

// Detect the alert level from the equipment_id prefix.
const levelOf = (equipmentId: string): 'Warning' | 'Alert' => {
  if (/^alert/i.test(equipmentId)) return 'Alert'
  return 'Warning'
}

const LevelBadge = ({ equipmentId }: { equipmentId: string }) => {
  const level = levelOf(equipmentId)
  const color = level === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <span
      className='inline-block px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {level}
    </span>
  )
}

const LineStatusBadge = ({ status }: { status: string }) => {
  const color = status === 'UP' ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-block px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {status}
    </span>
  )
}

/** Map (left) + event log table (right) below the charts row. The table is
 *  fed by /imei/{imei}/alerts. */
const MapEventSection: React.FC = () => {
  const { project, imei } = useDetailContext()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    getLightingAlertsAPI(imei, { limit: 100, sort: 'DESC' })
      .then((res) => { if (active) setAlerts(res.data?.res_data ?? []) })
      .catch((err) => console.error('alerts failed:', err))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei])

  const total = alerts.length
  const upCount = alerts.filter((a) => a.status === 'UP').length
  const downCount = alerts.filter((a) => a.status === 'DOWN').length
  const summary = [
    { ...SUMMARY_STATS[0], value: total },
    { ...SUMMARY_STATS[1], value: upCount },
    { ...SUMMARY_STATS[2], value: downCount },
  ]

  const columns: ColumnsType<AlertItem> = useMemo(
    () => [
      {
        title: 'วันที่และเวลา',
        dataIndex: 'timestamp',
        key: 'timestamp',
        align: 'center',
        width: 180,
        render: (t: string) => (
          <span className='text-white'>
            {t ? dayjs(t).format('D MMM BBBB HH:mm:ss') : '-'}
          </span>
        ),
      },
      {
        title: 'อุปกรณ์',
        dataIndex: 'equipment_id',
        key: 'equipment_id',
        align: 'center',
        width: 200,
        render: (eid: string) => <LevelBadge equipmentId={eid} />,
      },
      {
        title: 'เหตุการณ์',
        dataIndex: 'incident',
        key: 'incident',
        align: 'center',
        render: (v: string) => <span style={{ color: '#66AEFF' }}>{v}</span>,
      },
      {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 100,
        render: (s: string) => <LineStatusBadge status={s} />,
      },
    ],
    [],
  )

  return (
    <div className='flex flex-col lg:flex-row lg:items-start w-full gap-3 mt-4 pb-5'>
      {/* Map */}
      <div
        className='relative w-full lg:w-[45%] xl:w-[42%] shrink-0 min-h-[300px] h-[300px] sm:h-[400px] lg:h-[480px] rounded-2xl overflow-hidden bg-[#212121]'
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
          {summary.map((stat) => (
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
                {loaded ? stat.value : '-'}
              </span>
            </div>
          ))}
        </div>

        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<AlertItem>
            rowKey={(r) => `${r.imei}-${r.timestamp}`}
            columns={columns}
            dataSource={alerts}
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (t, range) => `${range[0]}-${range[1]} จาก ${t} รายการ` }}
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
