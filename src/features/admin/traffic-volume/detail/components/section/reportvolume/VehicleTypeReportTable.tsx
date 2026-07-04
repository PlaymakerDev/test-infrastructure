"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { fmtNumber } from '@/utils/formatNumber'
import { VEHICLE_TYPES } from '../overall/data/vehicleTypes'
import type { VehicleTypeReportRow } from './data/reportMock'

interface Props {
  rows: VehicleTypeReportRow[]
}

interface TableRow extends VehicleTypeReportRow {
  key: string
  label: string
  color: string
}

/** Build a quick lookup so we can attach `label` + `color` to each data row
 *  in one pass without nested finds. */
const VEHICLE_LOOKUP: Record<string, { label: string; color: string }> =
  Object.fromEntries(
    VEHICLE_TYPES.map((v) => [v.key, { label: v.label, color: v.color }])
  )

/** Tier the share-pill colour by traffic dominance. Thresholds picked off
 *  the design: < 20% green (low), < 50% orange (moderate), ≥ 50% red
 *  (dominant). */
const sharePillStyle = (
  percent: number
): { color: string; background: string } => {
  if (percent >= 50) {
    return { color: '#FF6B7A', background: 'rgba(255, 68, 68, 0.18)' }
  }
  if (percent >= 20) {
    return { color: '#FF9500', background: 'rgba(255, 149, 0, 0.18)' }
  }
  return { color: '#00FF55', background: 'rgba(0, 255, 85, 0.16)' }
}

const VehicleTypeReportTable: React.FC<Props> = ({ rows }) => {
  /** Decorate each row with its display label + dot colour from
   *  VEHICLE_TYPES. Rows whose key isn't in the lookup fall back to the raw
   *  key with white dots — keeps unknown vehicle types visible. */
  const data = useMemo<TableRow[]>(
    () =>
      rows.map((r) => {
        const meta = VEHICLE_LOOKUP[r.vehicleKey]
        return {
          ...r,
          key: r.vehicleKey,
          label: meta?.label ?? r.vehicleKey,
          color: meta?.color ?? '#ffffff',
        }
      }),
    [rows]
  )

  const numCell = (val: number, decimals = 0) => (
    <span className='tabular-nums text-white'>{fmtNumber(val, decimals)}</span>
  )

  const columns: ColumnsType<TableRow> = useMemo(
    () => [
      {
        title: 'ประเภทยานพาหนะ',
        key: 'vehicle',
        width: 200,
        render: (_: unknown, row) => (
          <span className='inline-flex items-center gap-2'>
            <span
              className='inline-block w-2.5 h-2.5 rounded-full'
              style={{ background: row.color }}
            />
            <span className='text-white'>{row.label}</span>
          </span>
        ),
      },
      {
        title: 'รวมยานพาหนะ',
        dataIndex: 'totalVehicles',
        key: 'totalVehicles',
        width: 140,
        render: (v: number) => numCell(v),
      },
      {
        title: 'รวม PCU',
        dataIndex: 'totalPCU',
        key: 'totalPCU',
        width: 120,
        render: (v: number) => numCell(v, Number.isInteger(v) ? 0 : 1),
      },
      {
        title: 'PCU Factor',
        dataIndex: 'pcuFactor',
        key: 'pcuFactor',
        width: 120,
        render: (v: number) => numCell(v, Number.isInteger(v) ? 0 : 2),
      },
      {
        title: 'สัดส่วน (%)',
        dataIndex: 'sharePercent',
        key: 'sharePercent',
        width: 130,
        render: (v: number) => {
          const style = sharePillStyle(v)
          return (
            <span
              className='inline-flex items-center justify-center rounded-full px-3 py-0.5 fs-12 font-medium tabular-nums'
              style={style}
            >
              {fmtNumber(v, 1)}%
            </span>
          )
        },
      },
      {
        title: 'PCU เฉลี่ย / ชั่วโมง',
        dataIndex: 'avgPCUPerHour',
        key: 'avgPCUPerHour',
        width: 160,
        render: (v: number) => numCell(v, Number.isInteger(v) ? 0 : 1),
      },
      {
        title: 'PCU สูงสุด / ชั่วโมง',
        dataIndex: 'maxPCUPerHour',
        key: 'maxPCUPerHour',
        width: 160,
        render: (v: number) => numCell(v, Number.isInteger(v) ? 0 : 1),
      },
    ],
    []
  )

  return (
    <section>
      <p className='fs-14 text-(--yellow) mb-2'>ตารางรายงานวิเคราะห์ตามประเภทรถ</p>
      <Table<TableRow>
        rowKey='key'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        scroll={{ x: 1100 }}
        className='bridge-projects-table'
      />
    </section>
  )
}

export default React.memo<Props>(VehicleTypeReportTable)
