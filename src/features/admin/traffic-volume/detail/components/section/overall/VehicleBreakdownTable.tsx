"use client"
import React, { useMemo } from 'react'
import { TbCar } from 'react-icons/tb'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { fmtNumber } from '@/utils/formatNumber'
import { useTrafficVolumeCountHour } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type {
  CountingDailyVehicleCount,
  CountingVehicleTypeStat,
} from '@/types/traffic-volume/detail-api'
import { VEHICLE_TYPES } from './data/vehicleTypes'

interface Props {}

interface Row {
  key: string
  label: string
  color: string
  count: number
  pcuFactor: number | null
  totalPCU: number
  pct: number
  isSummary?: boolean
}

/** Internal type key → API field key. The API uses `bike` for motorcycles
 *  while our internal config uses `motorcycle`; everything else lines up. */
const API_KEY_BY_TYPE_KEY: Record<string, keyof CountingDailyVehicleCount> = {
  motorcycle: 'bike',
  car: 'car',
  pickup: 'pickup',
  taxi: 'taxi',
  bus: 'bus',
  truck: 'truck',
  trailer: 'trailer',
}

const EMPTY_STAT: CountingVehicleTypeStat = {
  count: 0,
  pcu_factor: 0,
  total_pcu: 0,
  percentage: 0,
}

const VehicleBreakdownTable: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const { data, isLoading } = useTrafficVolumeCountHour({ solution_id: id })
  const breakdown = data?.daily_vehicle_count

  const rows = useMemo<Row[]>(() => {
    const list = VEHICLE_TYPES.map<Row>((t) => {
      const apiKey = API_KEY_BY_TYPE_KEY[t.key]
      const stat = (apiKey && breakdown?.[apiKey]) || EMPTY_STAT
      return {
        key: t.key,
        label: t.label,
        color: t.color,
        count: stat.count,
        pcuFactor: stat.pcu_factor,
        totalPCU: stat.total_pcu,
        pct: stat.percentage,
      }
    })
    const total = breakdown?.total ?? EMPTY_STAT
    list.push({
      key: '__summary__',
      label: 'รวมทั้งหมด',
      color: '#FCD116',
      count: total.count,
      // Summary row's PCU factor is null per the API (no single weighted avg
      // makes sense across mixed-factor types); render "-" downstream.
      pcuFactor: total.pcu_factor,
      totalPCU: total.total_pcu,
      pct: total.percentage,
      isSummary: true,
    })
    return list
  }, [breakdown])

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'ประเภทยานพาหนะ',
        key: 'label',
        render: (_: unknown, row: Row) => {
          if (row.isSummary) {
            return (
              <span className='text-(--yellow) font-semibold'>{row.label}</span>
            )
          }
          return (
            <span className='inline-flex items-center gap-2'>
              <span
                className='inline-block w-2.5 h-2.5 rounded-full'
                style={{ background: row.color }}
              />
              <span className='text-white'>{row.label}</span>
            </span>
          )
        },
      },
      {
        title: 'จำนวน (คัน)',
        key: 'count',
        align: 'right',
        width: 110,
        render: (_: unknown, row: Row) => (
          <span
            className={`tabular-nums ${
              row.isSummary ? 'text-(--yellow) font-semibold' : 'text-white'
            }`}
          >
            {fmtNumber(row.count, 0)}
          </span>
        ),
      },
      {
        title: 'PCU Factor',
        key: 'pcuFactor',
        align: 'right',
        width: 100,
        render: (_: unknown, row: Row) => (
          <span
            className={`tabular-nums ${
              row.isSummary ? 'text-(--yellow) font-semibold' : 'text-white'
            }`}
          >
            {row.pcuFactor == null ? '-' : row.pcuFactor}
          </span>
        ),
      },
      {
        title: 'รวม PCU',
        key: 'totalPCU',
        align: 'right',
        width: 100,
        render: (_: unknown, row: Row) => (
          <span
            className={`tabular-nums ${
              row.isSummary ? 'text-(--yellow) font-semibold' : 'text-white'
            }`}
          >
            {fmtNumber(row.totalPCU, 0)}
          </span>
        ),
      },
      {
        title: 'สัดส่วน (%)',
        key: 'pct',
        align: 'right',
        width: 110,
        render: (_: unknown, row: Row) => (
          <span
            className={`tabular-nums ${
              row.isSummary ? 'text-(--yellow) font-semibold' : 'text-white'
            }`}
          >
            {fmtNumber(row.pct, 1)}%
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div
      className='py-3 px-5 rounded-[14px] h-full flex flex-col'
      style={{
        border: `1.5px solid #1f2d3d`,
        background: '#191919',
      }}
    >
      <div className='flex items-center gap-2 mb-2'>
        <TbCar size={22} className='text-(--yellow)' />
        <span className='fs-16 font-medium text-(--yellow)'>
          ข้อมูลแยกประเภทยานพาหนะประจำวัน
        </span>
      </div>

      {/* Cell padding bumped via `.vehicle-breakdown-table` (see antd.css) so
        * rows stretch to fill the card and balance the donut next to it. */}
      <Table<Row>
        rowKey='key'
        columns={columns}
        dataSource={rows}
        pagination={false}
        size='middle'
        loading={isLoading}
        className='bridge-projects-table vehicle-breakdown-table'
      />
    </div>
  )
}

export default React.memo<Props>(VehicleBreakdownTable)
