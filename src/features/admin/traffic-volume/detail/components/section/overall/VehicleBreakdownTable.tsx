"use client"
import React, { useEffect, useMemo, useRef } from 'react'
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

  // Stretch the antd table to fill the card's spare height. A pure-CSS height
  // chain can't reliably thread a definite height through antd's nested spin/
  // table wrappers, so we measure the available box (the `flex-1` wrapper) and
  // set the real <table>'s height — a table taller than its content hands the
  // extra height to its rows, distributing it evenly down to the summary row.
  const fillRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = fillRef.current
    if (!box) return
    const apply = () => {
      const table = box.querySelector<HTMLTableElement>('.ant-table-content > table')
      if (table) table.style.height = `${box.clientHeight}px`
    }
    apply()
    // `box` is a `flex-1 min-h-0` item — its height comes from the flex column,
    // not its content, so setting the table height can't feed back into it
    // (no resize loop). Re-measure whenever the card is resized.
    const ro = new ResizeObserver(apply)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

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
        <span className='fs-14 font-normal text-(--yellow)'>
          ข้อมูลแยกประเภทยานพาหนะประจำวัน
        </span>
      </div>

      {/* `flex-1` gives this box the card's spare height; the effect above then
        * sets the inner <table>'s height to match so its rows distribute evenly
        * to fill — no dead space below the summary row on a tall card. */}
      <div ref={fillRef} className='flex-1 min-h-0 flex flex-col'>
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
    </div>
  )
}

export default React.memo<Props>(VehicleBreakdownTable)
