"use client"
import React, { useMemo, useState } from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import { type ViolationFilter } from './filter'
import AppPagination from '@/components/pagination/AppPagination'
import { isVehicleViolation, parseViolationTimestamp, useViolationRows } from './useViolationRows'

interface Props {
  filter: ViolationFilter
  /** Reports pagination up to the parent section so the export modal's
   *  หน้าปัจจุบัน scope can mirror the exact rows this table shows. */
  onPageChange?: (page: number, pageSize: number) => void
}

interface Row extends CrosswalkViolationRow {
  seq: number
}

const PAGE_SIZE = 10

const TableViolationData: React.FC<Props> = ({ filter, onPageChange }) => {
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const { pageRows, total, page, setPage, isLoading, pageStart } =
    useViolationRows(filter, pageSize)

  const rows = useMemo<Row[]>(
    () => pageRows.map((r, i) => ({ ...r, seq: pageStart + i + 1 })),
    [pageRows, pageStart],
  )

  const columns: ColumnsType<Row> = [
    {
      title: 'ลำดับ',
      dataIndex: 'seq',
      key: 'seq',
      width: 80,
      // Indent first column 28px — same as tab 1's camera table (TableCameraData),
      // so the two tabs' tables line up (2026-08-17 request).
      onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      onCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
    },
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      width: 200,
      render: (_, row) => {
        const { date, time } = parseViolationTimestamp(row.crosswalk.timestamp)
        return (
          <div>
            <p className='mb-0'>{date || '-'}</p>
            <p className='mb-0 text-white/60'>{time ? `${time} น.` : ''}</p>
          </div>
        )
      },
    },
    {
      title: 'ประเภทเหตุการณ์',
      key: 'eventType',
      width: 260,
      render: (_, row) => {
        // รถ (vehicle) → orange; คน (pedestrian) → the original red.
        const color = isVehicleViolation(row.crosswalk.name_th) ? '#FF7B00' : '#E94C4C'
        return (
          <span
            className='inline-block py-0.5 px-3 rounded-full fs-12 whitespace-nowrap border'
            style={{ borderColor: color, color }}
          >
            {row.crosswalk.name_th}
          </span>
        )
      },
    },
    {
      title: 'กล้อง',
      key: 'camera',
      width: 400,
      render: (_, row) => row.camera.name,
    },
    {
      title: 'ภาพเหตุการณ์',
      dataIndex: 'image_path',
      key: 'image',
      width: 140,
      render: (src: string) =>
        src ? (
          <Image
            src={src}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='event'
          />
        ) : (
          <span className='text-white/40'>-</span>
        ),
    },
    // IP Address is the LAST column on every detail-page table (2026-08-17
    // request, applied app-wide). It inherits the previous last column's
    // fixed-right pin so horizontal scroll behaviour is unchanged.
    {
      title: 'IP Address',
      key: 'ipAddress',
      width: 140,
      fixed: 'right',
      render: (_, row) => {
        // `camera_ip` rides on the violation row itself (BE added 2026-08 —
        // replaced the old cameras-list lookup, whose ids never matched the
        // violation rows' camera uuids). No sta fallback: a km value under an
        // "IP Address" header reads as a bug (manual screenshots, 2026-08-03).
        return row.camera.camera_ip || '-'
      },
    },
  ]

  const showPagination = total > 0

  return (
    <div className='flex flex-col gap-3'>
      <Table<Row>
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size='middle'
        rowKey='seq'
        scroll={{ x: 'max-content' }}
        className='bridge-projects-table'
      />
      {showPagination && (
        <AppPagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, s) => {
            setPage(p)
            setPageSize(s)
            onPageChange?.(p, s)
          }}
        />
      )}
    </div>
  )
}

export default React.memo<Props>(TableViolationData)
