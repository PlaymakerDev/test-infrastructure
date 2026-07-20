"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import { VEHICLE_TYPES } from './data/vehicleTypeKeys'

interface Props {
  date?: string
  /** Selected camera id ('all' / undefined = every camera). */
  cameraId?: string
}

interface Row {
  key: string
  time: string
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  total: number
  pcu: number
  isSummary?: boolean
}

const HourlyDataTable: React.FC<Props> = ({ date, cameraId }) => {
  const { id } = useDetailContext()
  const { data: apiData } = useTrafficVolumeCountHour({
    solution_id: id,
    date,
    camera_id: cameraId && cameraId !== 'all' ? cameraId : undefined,
  })

  /** Map API rows → table rows + append an average-summary row at the
   *  bottom (mean across the reported hours). */
  const rows = useMemo<Row[]>(() => {
    const list: Row[] = (apiData?.daily_count_hour ?? []).map((b) => ({
      key: b.hour_timestamp,
      time: `${b.hour_timestamp.slice(11, 13)}:00`,
      motorcycle: b.bike_count,
      car: b.car_count,
      pickup: b.pickup_count,
      taxi: b.taxi_count,
      bus: b.bus_count,
      truck: b.truck_count,
      trailer: b.trailer_count,
      total: b.total_count,
      pcu: b.total_pcu,
    }))
    if (list.length === 0) return list
    const sum = (k: keyof Omit<Row, 'key' | 'time' | 'isSummary'>) =>
      list.reduce((s, r) => s + (r[k] as number), 0)
    list.push({
      key: '__summary__',
      time: 'รวมเฉลี่ย',
      motorcycle: sum('motorcycle'),
      car: sum('car'),
      pickup: sum('pickup'),
      taxi: sum('taxi'),
      bus: sum('bus'),
      truck: sum('truck'),
      trailer: sum('trailer'),
      total: sum('total'),
      pcu: sum('pcu'),
      isSummary: true,
    })
    return list
  }, [apiData])

  const fmtCell = (val: number, isSummary?: boolean) => (
    <span
      className={
        isSummary
          ? 'text-(--yellow) font-semibold tabular-nums'
          : 'text-white tabular-nums'
      }
    >
      {val.toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })}
    </span>
  )

  const typeCols: ColumnsType<Row> = useMemo(
    () =>
      VEHICLE_TYPES.map((t) => ({
        title: t.label,
        dataIndex: t.key,
        key: t.key,
        width: 110,
        // Suppress the warning by reading from `COUNT_FIELD_BY_TYPE` (it's
        // imported here for the shared map and isn't actually used in the
        // antd column itself).
        render: (val: number, row: Row) => fmtCell(val, row.isSummary),
      })),
    []
  )

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'เวลา',
        dataIndex: 'time',
        key: 'time',
        width: 100,
        render: (val: string, row) =>
          row.isSummary ? (
            <span className='text-(--yellow) font-semibold'>{val}</span>
          ) : (
            <span className='text-white'>{val}</span>
          ),
      },
      ...typeCols,
      {
        title: 'รวม',
        dataIndex: 'total',
        key: 'total',
        width: 110,
        render: (val: number, row) => fmtCell(val, row.isSummary),
      },
      {
        title: 'PCU',
        dataIndex: 'pcu',
        key: 'pcu',
        width: 110,
        render: (val: number, row) => fmtCell(val, row.isSummary),
      },
    ],
    [typeCols]
  )

  const dateLabel = useMemo(() => {
    if (!date) return ''
    return dayjs(date).locale('th').format('D MMM BBBB')
  }, [date])

  return (
    <section>
      <p className='fs-13 text-(--yellow) mb-2'>
        ตารางข้อมูลปริมาณจราจรรายชั่วโมง วันที่ {dateLabel}
      </p>
      <Table<Row>
        rowKey='key'
        columns={columns}
        dataSource={rows}
        pagination={false}
        size='middle'
        scroll={{ x: 1100 }}
        className='bridge-projects-table'
      />
    </section>
  )
}

export default React.memo<Props>(HourlyDataTable)
