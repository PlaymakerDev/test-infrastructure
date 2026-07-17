"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { fmtNumber } from '@/utils/formatNumber'
import type {
  HourlyReportCameraGroup,
  HourlyReportRow,
} from './data/reportMock'

interface Props {
  groups: HourlyReportCameraGroup[]
}

/** A row is either a per-camera header (spans all columns), a regular
 *  per-hour data row, or a "รวมเฉลี่ย" summary row emitted at the end of
 *  each camera group. */
type Row =
  | { kind: 'camera'; key: string; cameraName: string; hoursCollected: number }
  | { kind: 'hour'; key: string; row: HourlyReportRow }
  | { kind: 'summary'; key: string; row: HourlyReportRow }

// 11 visible columns: วันที่ + 7 vehicle types + รวมยานพาหนะ + รวม PCU
// + รถบรรทุก (%). Camera header row uses `colSpan: TOTAL_COLS` on the
// "วันที่" column to span the entire table width.
const TOTAL_COLS = 11

/** Sum every numeric column across the group's hour rows — matches the
 *  aggregate pattern used by `HourlyDataTable` (stat-hour tab). Feeds the
 *  trailing "รวมเฉลี่ย" row emitted after each camera group. */
const sumHourRow = (rows: HourlyReportRow[]): HourlyReportRow => {
  let motorcycle = 0, car = 0, pickup = 0, taxi = 0, bus = 0, truck = 0, trailer = 0
  let totalVehicles = 0, totalPCU = 0, truckPercent = 0
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
    truckPercent += r.truckPercent
  }
  return {
    hourTimestamp: '',
    motorcycle, car, pickup, taxi, bus, truck, trailer,
    totalVehicles, totalPCU, truckPercent,
  }
}

const HourlyReportTable: React.FC<Props> = ({ groups }) => {
  /** Flatten the camera-grouped data into a single sortable row list.
   *  Each group emits: 1 camera header → N hour rows → 1 summary row. */
  const data = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const g of groups) {
      out.push({
        kind: 'camera',
        key: `cam-${g.cameraName}`,
        cameraName: g.cameraName,
        hoursCollected: g.hoursCollected,
      })
      for (const r of g.rows) {
        out.push({
          kind: 'hour',
          key: `${g.cameraName}-${r.hourTimestamp}`,
          row: r,
        })
      }
      if (g.rows.length > 0) {
        out.push({
          kind: 'summary',
          key: `${g.cameraName}-summary`,
          row: sumHourRow(g.rows),
        })
      }
    }
    return out
  }, [groups])

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

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'วันที่',
        key: 'date',
        width: 140,
        onCell: (row) => {
          // Camera-header row spans all columns; hide other columns on that row.
          if (row.kind === 'camera') {
            return {
              colSpan: TOTAL_COLS,
              style: { background: '#2a2a2a', padding: '10px 16px' },
            }
          }
          // Summary rows share a subtle darker background for visual grouping.
          if (row.kind === 'summary') {
            return { style: { background: '#191919' } }
          }
          return {}
        },
        render: (_: unknown, row: Row) => {
          if (row.kind === 'camera') {
            return (
              <span className='inline-flex items-center gap-3'>
                <span className='text-(--yellow) font-semibold'>
                  {row.cameraName}
                </span>
                <span className='text-white/55 fs-12'>
                  เก็บข้อมูล {row.hoursCollected} ชั่วโมง
                </span>
              </span>
            )
          }
          if (row.kind === 'summary') {
            return (
              <span className='text-(--yellow) font-semibold'>รวมเฉลี่ย</span>
            )
          }
          const dt = dayjs(row.row.hourTimestamp).locale('th')
          const hh = row.row.hourTimestamp.slice(11, 13)
          return (
            <div className='flex flex-col leading-tight'>
              <span className='text-white'>{hh}:00 น.</span>
              <span className='fs-12 text-white/55'>{dt.format('D MMM BBBB')}</span>
            </div>
          )
        },
      },
      {
        title: 'รถจักรยานยนต์',
        key: 'motorcycle',
        width: 130,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.motorcycle, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถยนต์',
        key: 'car',
        width: 110,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.car, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถกระบะ',
        key: 'pickup',
        width: 110,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.pickup, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถแท็กซี่',
        key: 'taxi',
        width: 110,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.taxi, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถบัส',
        key: 'bus',
        width: 100,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.bus, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถบรรทุก',
        key: 'truck',
        width: 110,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.truck, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รถพ่วง',
        key: 'trailer',
        width: 100,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.trailer, { isSummary: row.kind === 'summary' }),
      },
      {
        title: 'รวมยานพาหนะ',
        key: 'totalVehicles',
        width: 140,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.totalVehicles, {
              color: '#66AEFF',
              isSummary: row.kind === 'summary',
            }),
      },
      {
        title: 'รวม PCU',
        key: 'totalPCU',
        width: 120,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.totalPCU, {
              color: '#00FF55',
              decimals: 1,
              isSummary: row.kind === 'summary',
            }),
      },
      {
        title: 'รถบรรทุก (%)',
        key: 'truckPercent',
        width: 130,
        onCell: (row) =>
          row.kind === 'camera'
            ? { colSpan: 0 }
            : row.kind === 'summary'
              ? { style: { background: '#191919' } }
              : {},
        render: (_: unknown, row: Row) => {
          if (row.kind === 'camera') return null
          const isSummary = row.kind === 'summary'
          return (
            <span
              className={
                isSummary ? 'tabular-nums font-semibold' : 'tabular-nums'
              }
              style={{ color: isSummary ? '#FCD116' : '#FF4444' }}
            >
              {fmtNumber(row.row.truckPercent, 1)}%
            </span>
          )
        },
      },
    ],
    []
  )

  return (
    <section>
      <p className='fs-14 text-(--yellow) mb-2'>ตารางรายงานสรุปรายชั่วโมง</p>
      <Table<Row>
        rowKey='key'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        scroll={{ x: 1400 }}
        className='bridge-projects-table'
      />
    </section>
  )
}

export default React.memo<Props>(HourlyReportTable)
