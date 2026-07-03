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

/** A row is either a per-camera header (spans all columns) or a regular
 *  per-hour data row. */
type Row =
  | { kind: 'camera'; key: string; cameraName: string; hoursCollected: number }
  | { kind: 'hour'; key: string; row: HourlyReportRow }

// 11 visible columns: วันที่ + 7 vehicle types + รวมยานพาหนะ + รวม PCU
// + รถบรรทุก (%). Camera header row uses `colSpan: TOTAL_COLS` on the
// "วันที่" column to span the entire table width.
const TOTAL_COLS = 11

const HourlyReportTable: React.FC<Props> = ({ groups }) => {
  /** Flatten the camera-grouped data into a single sortable row list.
   *  Each group emits: 1 camera header → N hour rows. */
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
    }
    return out
  }, [groups])

  const fmtCell = (
    val: number,
    options?: { color?: string; decimals?: number }
  ) => (
    <span className='tabular-nums' style={{ color: options?.color ?? '#ffffff' }}>
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
          const dt = dayjs(row.row.hourTimestamp).locale('th')
          const hh = row.row.hourTimestamp.slice(11, 13)
          return (
            <div className='flex flex-col leading-tight'>
              <span className='text-white'>{hh}:00 น.</span>
              <span className='fs-11 text-white/55'>{dt.format('D MMM BBBB')}</span>
            </div>
          )
        },
      },
      {
        title: 'รถจักรยานยนต์',
        key: 'motorcycle',
        width: 130,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.motorcycle),
      },
      {
        title: 'รถยนต์',
        key: 'car',
        width: 110,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.car),
      },
      {
        title: 'รถกระบะ',
        key: 'pickup',
        width: 110,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.pickup),
      },
      {
        title: 'รถแท็กซี่',
        key: 'taxi',
        width: 110,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.taxi),
      },
      {
        title: 'รถบัส',
        key: 'bus',
        width: 100,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.bus),
      },
      {
        title: 'รถบรรทุก',
        key: 'truck',
        width: 110,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.truck),
      },
      {
        title: 'รถพ่วง',
        key: 'trailer',
        width: 100,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : fmtCell(row.row.trailer),
      },
      {
        title: 'รวมยานพาหนะ',
        key: 'totalVehicles',
        width: 140,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.totalVehicles, { color: '#66AEFF' }),
      },
      {
        title: 'รวม PCU',
        key: 'totalPCU',
        width: 120,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera'
            ? null
            : fmtCell(row.row.totalPCU, { color: '#00FF55', decimals: 1 }),
      },
      {
        title: 'รถบรรทุก (%)',
        key: 'truckPercent',
        width: 130,
        onCell: (row) => (row.kind === 'camera' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'camera' ? null : (
            <span className='tabular-nums' style={{ color: '#FF4444' }}>
              {fmtNumber(row.row.truckPercent, 1)}%
            </span>
          ),
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
