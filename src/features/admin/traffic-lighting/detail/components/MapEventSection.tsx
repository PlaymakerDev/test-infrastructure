"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import MapLightingDetail from '@/features/admin/traffic-lighting/shared/MapLightingDetail'
import { useAllLightingAlerts } from '@/hooks/queries/lighting'
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
 *  fed by /imei/{imei}/alerts, fetched in full across as many pages as the
 *  backend actually has (no pagination UI, no row cap). */
const MapEventSection: React.FC = () => {
  const { project, imei, device } = useDetailContext()

  const { alerts, total, isLoading, isFetching } = useAllLightingAlerts(imei)
  // Now that the full set is fetched, UP/DOWN reflect the true totals, not
  // just whatever a single page happened to contain.
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
                {isLoading ? '-' : stat.value}
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
