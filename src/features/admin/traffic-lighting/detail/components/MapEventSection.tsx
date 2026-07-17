"use client"
import React, { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import MapLightingDetail from '@/features/admin/traffic-lighting/shared/MapLightingDetail'
import { useLightingAlerts } from '@/hooks/queries/lighting'
import type { AlertItem } from '@/types/lighting'
import { useDetailContext } from '../context'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const DEFAULT_LIMIT = 10

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
 *  fed by /imei/{imei}/alerts (server-side paginated). */
const MapEventSection: React.FC = () => {
  const { project, imei, device } = useDetailContext()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  // A different device (imei) resets pagination back to page 1 — adjusted
  // during render (React's recommended pattern) instead of an effect, so it
  // takes effect before the now-stale page number is used to fetch below.
  const [prevImei, setPrevImei] = useState(imei)
  if (imei !== prevImei) {
    setPrevImei(imei)
    setPage(1)
  }

  const { data, isFetching } = useLightingAlerts(imei, page, limit)
  const alerts = data?.res_data ?? []
  // "ทั้งหมด" comes from the backend's true count (meta_data.count); the
  // backend's /alerts endpoint has no status filter, so UP/DOWN can only
  // reflect the currently loaded page, not a global total.
  const total = data?.meta_data?.count ?? 0
  const upCount = alerts.filter((a) => a.status === 'UP').length
  const downCount = alerts.filter((a) => a.status === 'DOWN').length
  const summary = [
    { ...SUMMARY_STATS[0], value: total },
    { ...SUMMARY_STATS[1], value: upCount },
    { ...SUMMARY_STATS[2], value: downCount },
  ]

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPage(nextPage)
    setLimit(nextSize)
  }

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
        className='relative w-full lg:w-[45%] xl:w-[42%] shrink-0 min-h-[300px] h-[300px] sm:h-[400px] lg:h-[480px] rounded-[20px] overflow-hidden bg-[#212121]'
      >
        <MapLightingDetail
          coord={project.coord}
          imei={imei}
          isOnline={device?.is_online ?? project.connection === 'online'}
          roadCode={project.roadCode}
          installPoint={project.installPoint}
          projectName={project.projectName}
        />
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
                {data ? stat.value : '-'}
              </span>
            </div>
          ))}
        </div>

        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<AlertItem>
            rowKey={(r) => `${r.imei}-${r.timestamp}-${r.equipment_id}-${r.incident}-${r.status}`}
            columns={columns}
            dataSource={alerts}
            loading={isFetching}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
              onChange: handlePageChange,
            }}
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
