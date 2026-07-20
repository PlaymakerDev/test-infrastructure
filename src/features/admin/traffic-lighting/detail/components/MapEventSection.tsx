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

type StatusFilter = 'ALL' | 'UP' | 'DOWN'

const SUMMARY_STATS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด', color: '#FCD116' },
  { key: 'UP', label: 'UP', color: '#66AEFF' },
  { key: 'DOWN', label: 'DOWN', color: '#E94C4C' },
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
 *  fed by /imei/{imei}/alerts one page at a time (pageSize 10, refetched on
 *  page change) instead of eagerly pulling every page up front. All three
 *  summary badges (ALL/UP/DOWN) read the backend's own `meta_data.count` /
 *  `count_up` / `count_down` — accurate global totals regardless of which
 *  page is currently loaded. */
const MapEventSection: React.FC = () => {
  const { project, imei, device } = useDetailContext()
  const isOnline = device
    ? device.is_online
    : project.connection === 'online'
      ? true
      : project.connection === 'offline'
        ? false
        : undefined

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const pageSize = 10
  const alertsQuery = useLightingAlerts(imei, page, pageSize)
  const alerts = alertsQuery.data?.res_data ?? []
  const total = alertsQuery.data?.meta_data?.count ?? 0
  const upCount = alertsQuery.data?.meta_data?.count_up ?? 0
  const downCount = alertsQuery.data?.meta_data?.count_down ?? 0
  const isLoading = alertsQuery.isLoading
  const isFetching = alertsQuery.isFetching
  const isError = alertsQuery.isError
  const alertsUnavailable = !imei || isLoading || isError
  const summaryValues: Record<StatusFilter, number> = { ALL: total, UP: upCount, DOWN: downCount }
  // Filters the currently-loaded page only — there's no server-side status
  // param, so selecting UP/DOWN can't reach into rows outside the fetched
  // page even though the badge counts above are accurate globally.
  const filteredAlerts = statusFilter === 'ALL' ? alerts : alerts.filter((a) => a.status === statusFilter)

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
        <MapLightingDetail
          coord={project.coord}
          imei={imei}
          isOnline={isOnline}
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
          {SUMMARY_STATS.map((stat) => {
            const isActive = statusFilter === stat.key
            return (
              <div
                key={stat.key}
                role='button'
                tabIndex={0}
                onClick={() => setStatusFilter(stat.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(stat.key) }}
                className='box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-[calc(50%-4px)] min-w-[110px] max-w-[130px] sm:w-[130px] h-[46px] cursor-pointer select-none transition-colors'
                style={{
                  ...(isActive
                    ? { background: stat.color }
                    : { background: 'transparent', border: `2px solid ${stat.color}` }),
                }}
              >
                <span
                  className='text-[12px] font-normal m-0 leading-none shrink-0'
                  style={{ color: isActive ? '#212121' : stat.color }}
                >
                  {stat.label}
                </span>
                <span
                  className='flex items-center justify-center text-[14px] font-normal m-0 leading-none shrink-0 rounded-[5px]'
                  style={{
                    width: 50,
                    height: 30,
                    ...(isActive
                      ? { background: '#212121', color: stat.color }
                      : { background: stat.color, color: '#212121' }),
                  }}
                >
                  {alertsUnavailable ? '-' : summaryValues[stat.key]}
                </span>
              </div>
            )
          })}
        </div>

        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<AlertItem>
            rowKey={(r) => `${r.imei}-${r.timestamp}-${r.equipment_id}-${r.incident}-${r.status}`}
            columns={columns}
            dataSource={isError ? [] : filteredAlerts}
            loading={isFetching}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: false,
              onChange: setPage,
            }}
            size='middle'
            className='bridge-projects-table event-log-table'
            locale={{
              emptyText: isError
                ? 'ไม่สามารถโหลดข้อมูลเหตุการณ์ได้'
                : !imei
                  ? 'ไม่มี IMEI — ไม่สามารถโหลดข้อมูลเหตุการณ์ได้'
                  : isLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(MapEventSection)
