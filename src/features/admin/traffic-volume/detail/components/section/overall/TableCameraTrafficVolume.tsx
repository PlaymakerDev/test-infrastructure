"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatusPill } from '@/components/modal-live-stream/LiveStreamModal'
import type { CameraEntry } from './CamerasGridTrafficVolume'

interface Props {
  cameras: CameraEntry[]
  /** Called when a row is clicked — opens the Live Stream modal. */
  onOpen: (cam: CameraEntry) => void
}

interface CameraRow extends CameraEntry {
  seq: number
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
      title: 'พิกัด',
      key: 'coord',
      width: 220,
      align: 'center',
      render: (_, row) => {
        if (!row.geometryPoint) {
          return <span className='text-white/40 text-sm'>-</span>
        }
        const [lng, lat] = row.geometryPoint
        return (
          <span className='text-white/80 text-sm font-mono'>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )
      },
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
