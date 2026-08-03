"use client"
import React, { useMemo, useState } from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
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
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const { pageRows, total, page, setPage, isLoading, pageStart } =
    useViolationRows(filter, pageSize)

  // Look up the real ip_address from the cached `/cameras` list — a single
  // request shared with the OVERALL tab, replacing the previous per-row
  // `getCCTVDetailAPI` N+1. Cameras missing from the list show '-'.
  const { data: camerasData } = useCrosswalkCameras(deptId, { solution_id: id })
  const ipByCameraId = useMemo(() => {
    const m = new Map<string, string | undefined>()
    for (const c of camerasData?.cameras ?? []) m.set(c.id, c.ip_address)
    return m
  }, [camerasData])

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
            className='inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border'
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
      title: 'IP Address',
      key: 'ipAddress',
      width: 140,
      render: (_, row) => {
        // No sta fallback: a km value under an "IP Address" header reads as
        // a bug (the manual's screenshots caught "1+447" here, 2026-08-03).
        return ipByCameraId.get(row.camera.id) || '-'
      },
    },
    {
      title: 'ภาพเหตุการณ์',
      dataIndex: 'image_path',
      key: 'image',
      width: 140,
      fixed: 'right',
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
