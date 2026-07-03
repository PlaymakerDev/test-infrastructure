"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { fmtNumber } from '@/utils/formatNumber'
import type { MonthlyReportRow } from './data/reportMock'

interface Props {
  rows: MonthlyReportRow[]
}

interface TableRow extends MonthlyReportRow {
  key: string
}

const MonthlyReportTable: React.FC<Props> = ({ rows }) => {
  const data = useMemo<TableRow[]>(
    () =>
      rows.map((r) => ({
        ...r,
        key: `${r.year}-${r.month.toString().padStart(2, '0')}`,
      })),
    [rows]
  )

  const fmtCell = (
    val: number,
    options?: { color?: string; decimals?: number }
  ) => (
    <span className='tabular-nums' style={{ color: options?.color ?? '#ffffff' }}>
      {fmtNumber(val, options?.decimals ?? 0)}
    </span>
  )

  const columns: ColumnsType<TableRow> = useMemo(
    () => [
      {
        title: 'เดือน',
        key: 'monthYear',
        width: 160,
        render: (_: unknown, row) => {
          // Build a date at the 1st of the month so dayjs can format month +
          // Buddhist Era year. Pad month to 2 digits for a stable ISO string.
          const d = dayjs(
            `${row.year}-${row.month.toString().padStart(2, '0')}-01`
          ).locale('th')
          return (
            <div className='flex flex-col leading-tight'>
              <span className='text-white'>{d.format('MMM BBBB')}</span>
              {row.daysCollected > 0 && (
                <span className='fs-11 text-white/55'>
                  เก็บข้อมูล {fmtNumber(row.daysCollected, 0)} วัน
                </span>
              )}
            </div>
          )
        },
      },
      {
        title: 'รถจักรยานยนต์',
        dataIndex: 'motorcycle',
        key: 'motorcycle',
        width: 130,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถยนต์',
        dataIndex: 'car',
        key: 'car',
        width: 110,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถกระบะ',
        dataIndex: 'pickup',
        key: 'pickup',
        width: 110,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถแท็กซี่',
        dataIndex: 'taxi',
        key: 'taxi',
        width: 110,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถบัส',
        dataIndex: 'bus',
        key: 'bus',
        width: 100,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถบรรทุก',
        dataIndex: 'truck',
        key: 'truck',
        width: 110,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รถพ่วง',
        dataIndex: 'trailer',
        key: 'trailer',
        width: 100,
        render: (v: number) => fmtCell(v),
      },
      {
        title: 'รวมยานพาหนะ',
        dataIndex: 'totalVehicles',
        key: 'totalVehicles',
        width: 140,
        render: (v: number) => fmtCell(v, { color: '#66AEFF' }),
      },
      {
        title: 'รวม PCU',
        dataIndex: 'totalPCU',
        key: 'totalPCU',
        width: 120,
        render: (v: number) => fmtCell(v, { color: '#00FF55', decimals: 1 }),
      },
      {
        title: 'PCU สูงสุด / ชั่วโมง',
        dataIndex: 'maxPCUPerHour',
        key: 'maxPCUPerHour',
        width: 160,
        render: (v: number) => fmtCell(v, { color: '#FF9500' }),
      },
      {
        title: 'รถบรรทุก (%)',
        dataIndex: 'truckPercent',
        key: 'truckPercent',
        width: 130,
        render: (v: number) => (
          <span className='tabular-nums' style={{ color: '#FF4444' }}>
            {fmtNumber(v, 1)}%
          </span>
        ),
      },
    ],
    []
  )

  return (
    <section>
      <p className='fs-14 text-(--yellow) mb-2'>ตารางรายงานสรุปรายเดือน</p>
      <Table<TableRow>
        rowKey='key'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        scroll={{ x: 1500 }}
        className='bridge-projects-table'
      />
    </section>
  )
}

export default React.memo<Props>(MonthlyReportTable)
