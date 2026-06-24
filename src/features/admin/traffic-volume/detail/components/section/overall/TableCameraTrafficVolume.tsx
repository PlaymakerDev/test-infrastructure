"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { StatusPill } from '@/components/modal-live-stream/LiveStreamModal'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'
import type { CameraEntry } from './CamerasGridTrafficVolume'

interface Props {
  cameras: CameraEntry[]
  /** Called when a row is clicked — opens the Live Stream modal. */
  onOpen: (cam: CameraEntry) => void
}

interface CameraRow extends CameraEntry {
  seq: number
}

/** Per-row IP cell. Shares the `['cctv_detail', id]` cache key with the
 *  Live Stream modal and the GRID tile, so the value is already warm
 *  whenever the user has touched any of those views first. */
const IPAddressCell: React.FC<{ id: string; fallback?: string }> = ({
  id,
  fallback,
}) => {
  const { data: cctv } = useQuery({
    queryKey: ['cctv_detail', id],
    queryFn: () => getCCTVDetailAPI(id),
    enabled: !!id,
  })
  const ip = cctv?.data?.ip_address ?? fallback
  return (
    <span className='text-white/80 text-sm font-mono'>{ip ?? '-'}</span>
  )
}

const TableCameraTrafficVolume: React.FC<Props> = ({ cameras, onOpen }) => {
  const data = useMemo<CameraRow[]>(
    () => cameras.map((c, i) => ({ ...c, seq: i + 1 })),
    [cameras]
  )

  const columns: ColumnsType<CameraRow> = [
    {
      title: 'ลำดับที่',
      dataIndex: 'seq',
      key: 'seq',
      width: 80,
      align: 'center',
      render: (seq: number) => <span className='text-white/60'>{seq}</span>,
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'code',
      key: 'code',
      ellipsis: true,
      render: (code: string) => <span className='text-white text-sm'>{code}</span>,
    },
    {
      title: 'IP Address',
      key: 'ip',
      width: 200,
      align: 'center',
      render: (_, row) => (
        <IPAddressCell id={row.id} fallback={row.ipAddress} />
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'connection',
      key: 'connection',
      width: 140,
      align: 'center',
      render: (conn: 'online' | 'offline') => (
        <StatusPill status={conn === 'online' ? 'connect' : 'disconnect'} />
      ),
    },
  ]

  return (
    <Table<CameraRow>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      scroll={{ x: 800 }}
      // Clicking a row opens the Live Stream modal — mirrors GRID tile behavior.
      onRow={(record) => ({
        onClick: () => onOpen(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}

export default React.memo<Props>(TableCameraTrafficVolume)
