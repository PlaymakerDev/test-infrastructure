"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { fmtNumber } from '@/utils/formatNumber'
import type { DailyReportRow } from './data/reportMock'

interface Props {
  rows: DailyReportRow[]
}

/** Discriminates a normal data row from the trailing "รวมเฉลี่ย" summary row.
 *  Renderers key off `_summary` to swap the first cell for the summary label
 *  while every numeric column reads through the same `dataIndex`. */
interface TableRow extends DailyReportRow {
  key: string
  _summary?: true
}

// Thai weekday names indexed by Date.getDay() (0 = Sunday).
const THAI_DAY = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
] as const

/** Sum every numeric column across the visible rows. Matches the pattern
 *  used by `HourlyDataTable` (stat-hour tab) — the trailing "รวมเฉลี่ย" row
 *  in this codebase is the aggregate total of what's on screen. */
const sumRow = (rows: DailyReportRow[]): Omit<DailyReportRow, 'date'> => {
  let motorcycle = 0, car = 0, pickup = 0, taxi = 0, bus = 0, truck = 0, trailer = 0
  let totalVehicles = 0, totalPCU = 0, maxPCUPerHour = 0, truckPercent = 0
  for (const r of rows) {
    motorcycle += r.motorcycle
    car += r.car
    pickup += r.pickup
    taxi += r.taxi
    bus += r.bus
    truck += r.truck
    trailer += r.trailer
    totalVehicles += r.totalVehicles
    totalPCU += r.totalPCU
    maxPCUPerHour += r.maxPCUPerHour
    truckPercent += r.truckPercent
  }
  return {
    motorcycle, car, pickup, taxi, bus, truck, trailer,
    totalVehicles, totalPCU, maxPCUPerHour, truckPercent,
  }
}

const DailyReportTable: React.FC<Props> = ({ rows }) => {
  const data = useMemo<TableRow[]>(() => {
    const dataRows: TableRow[] = rows.map((r) => ({ ...r, key: r.date }))
    if (dataRows.length === 0) return dataRows
    // Trailing summary row — sums of every numeric column across the visible
    // page. Uses `date: ''` as a placeholder since the first column renders
    // "รวมเฉลี่ย" via the `_summary` flag.
    dataRows.push({
      ...sumRow(rows),
      date: '',
      key: '__summary__',
      _summary: true,
    })
    return dataRows
  }, [rows])

  const fmtCell = (
    val: number,
    options?: { color?: string; decimals?: number; isSummary?: boolean }
  ) => (
    <span
      className={
        options?.isSummary
          ? 'tabular-nums font-semibold'
          : 'tabular-nums'
      }
      style={{ color: options?.isSummary ? '#FCD116' : (options?.color ?? '#ffffff') }}
    >
      {fmtNumber(val, options?.decimals ?? 0)}
    </span>
  )

  const columns: ColumnsType<TableRow> = useMemo(
    () => [
      {
        title: 'วันที่',
        dataIndex: 'date',
        key: 'date',
        width: 140,
        render: (val: string, row) => {
          if (row._summary) {
            return (
              <span className='text-(--yellow) font-semibold'>รวมเฉลี่ย</span>
            )
          }
          const d = dayjs(val).locale('th')
          const dayName = THAI_DAY[new Date(val).getDay()]
          return (
            <div className='flex flex-col leading-tight'>
              <span className='text-white'>{d.format('D MMM BBBB')}</span>
              <span className='fs-11 text-white/55'>{dayName}</span>
            </div>
          )
        },
      },
      {
        title: 'รถจักรยานยนต์',
        dataIndex: 'motorcycle',
        key: 'motorcycle',
        width: 130,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถยนต์',
        dataIndex: 'car',
        key: 'car',
        width: 110,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถกระบะ',
        dataIndex: 'pickup',
        key: 'pickup',
        width: 110,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถแท็กซี่',
        dataIndex: 'taxi',
        key: 'taxi',
        width: 110,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถบัส',
        dataIndex: 'bus',
        key: 'bus',
        width: 100,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถบรรทุก',
        dataIndex: 'truck',
        key: 'truck',
        width: 110,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รถพ่วง',
        dataIndex: 'trailer',
        key: 'trailer',
        width: 100,
        render: (v: number, row) => fmtCell(v, { isSummary: row._summary }),
      },
      {
        title: 'รวมยานพาหนะ',
        dataIndex: 'totalVehicles',
        key: 'totalVehicles',
        width: 140,
        render: (v: number, row) =>
          fmtCell(v, { color: '#66AEFF', isSummary: row._summary }),
      },
      {
        title: 'รวม PCU',
        dataIndex: 'totalPCU',
        key: 'totalPCU',
        width: 120,
        render: (v: number, row) =>
          fmtCell(v, { color: '#00FF55', decimals: 1, isSummary: row._summary }),
      },
      {
        title: 'PCU สูงสุด / ชั่วโมง',
        dataIndex: 'maxPCUPerHour',
        key: 'maxPCUPerHour',
        width: 160,
        render: (v: number, row) =>
          fmtCell(v, { color: '#FF9500', isSummary: row._summary }),
      },
      {
        title: 'รถบรรทุก (%)',
        dataIndex: 'truckPercent',
        key: 'truckPercent',
        width: 130,
        render: (v: number, row) => (
          <span
            className={
              row._summary
                ? 'tabular-nums font-semibold'
                : 'tabular-nums'
            }
            style={{ color: row._summary ? '#FCD116' : '#FF4444' }}
          >
            {fmtNumber(v, 1)}%
          </span>
        ),
      },
    ],
    []
  )

  return (
    <section>
      <p className='fs-14 text-(--yellow) mb-2'>ตารางรายงานสรุปรายวัน</p>
      <Table<TableRow>
        rowKey='key'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        scroll={{ x: 1500 }}
        className='bridge-projects-table'
        onRow={(row) =>
          row._summary ? { style: { background: '#242424' } } : {}
        }
      />
    </section>
  )
}

export default React.memo<Props>(DailyReportTable)
