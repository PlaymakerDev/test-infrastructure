"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusPill } from '@/components/modal-live-stream/LiveStreamModal'
import type { CameraEntry } from './CamerasGridTrafficVolume'

interface Props {
  cameras: CameraEntry[]
  /** Map of `cameraId → ip_address` resolved by the parent's batched
   *  `useQueries` lookup. Falls back to `cam.ipAddress` when the cache
   *  hasn't filled yet, then to "-". */
  ipByCameraId: Map<string, string | undefined>
  /** Called when a row is clicked — opens the Live Stream modal. */
  onOpen: (cam: CameraEntry) => void
}

interface CameraRow extends CameraEntry {
  seq: number
}

const TableCameraTrafficVolume: React.FC<Props> = ({
  cameras,
  ipByCameraId,
  onOpen,
}) => {
  const data = useMemo<CameraRow[]>(
    () => cameras.map((c, i) => ({ ...c, seq: i + 1 })),
    [cameras]
  )

  const columns: ColumnsType<CameraRow> = useMemo(
    () => [
      {
        title: 'ลำดับที่',
        dataIndex: 'seq',
        key: 'seq',
        width: 80,
        render: (seq: number) => <span className='text-white/60'>{seq}</span>,
      },
      {
        title: 'ชื่อกล้อง',
        dataIndex: 'code',
        key: 'code',
        ellipsis: true,
        render: (code: string) => (
          <span className='text-white text-sm'>{code}</span>
        ),
      },
      {
        title: 'IP Address',
        key: 'ip',
        width: 200,
        render: (_: unknown, row: CameraRow) => {
          const ip = ipByCameraId.get(row.id) ?? row.ipAddress
          return (
            <span className='text-white/80 text-sm'>{ip ?? '-'}</span>
          )
        },
      },
      {
        title: 'สถานะ',
        dataIndex: 'connection',
        key: 'connection',
        width: 140,
        render: (conn: 'online' | 'offline') => (
          <StatusPill status={conn === 'online' ? 'connect' : 'disconnect'} />
        ),
      },
    ],
    [ipByCameraId]
  )

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
