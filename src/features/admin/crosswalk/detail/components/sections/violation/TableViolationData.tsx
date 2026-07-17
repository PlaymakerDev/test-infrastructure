"use client"
import React, { useMemo } from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import { type ViolationFilter } from './filter'
import BluePagination from './BluePagination'
import { parseViolationTimestamp, useViolationRows } from './useViolationRows'

interface Props {
  filter: ViolationFilter
}

interface Row extends CrosswalkViolationRow {
  seq: number
}

const PAGE_SIZE = 10

const TableViolationData: React.FC<Props> = ({ filter }) => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const { pageRows, totalPages, page, setPage, isLoading, pageStart } =
    useViolationRows(filter, PAGE_SIZE)

  // `/details/list` returns `camera.sta` that's often empty. Look up the real
  // ip_address from the cached `/cameras` list — a single request shared with
  // the OVERALL tab, replacing the previous per-row `getCCTVDetailAPI` N+1.
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
      render: (_, row) => (
        <span className='inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border border-[#E94C4C] text-[#E94C4C]'>
          {row.crosswalk.name_th}
        </span>
      ),
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
        const ip = ipByCameraId.get(row.camera.id)
        return ip || row.camera.sta || '-'
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

  const showPagination = totalPages > 1

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
        <BluePagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  )
}

export default React.memo<Props>(TableViolationData)
