"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { OutlinePill, StatusPill } from '@/components/modal-live-stream/LiveStreamModal'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import type { CameraEntry } from './CamerasGridTrafficSignal'

interface Props {
  cameras: CameraEntry[]
  /** Called when a row is clicked — opens the Live Stream modal. */
  onOpen: (cam: CameraEntry) => void
}

interface CameraRow extends CameraEntry {
  seq: number
}

const TableCameraTrafficSignal: React.FC<Props> = ({ cameras, onOpen }) => {
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
      // Indent first column 28px to match the overall-page list tables.
      onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      onCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      render: (seq: number) => <span className='text-white/60'>{seq}</span>,
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'code',
      key: 'code',
      width: 340,
      ellipsis: true,
      render: (code: string) => <span className='text-white fs-12'>{code}</span>,
    },
    {
      title: 'Phase',
      dataIndex: 'phase',
      key: 'phase',
      width: 90,
      render: (phase: number) => (
        <span className='font-semibold fs-12' style={{ color: getPhaseColor(phase) }}>
          P{phase}
        </span>
      ),
    },
    {
      title: 'การทำงาน',
      dataIndex: 'detectionMode',
      key: 'detectionMode',
      width: 130,
      render: (mode: 'Counting' | 'Stopline') => (
        <OutlinePill
          text={mode}
          color={mode === 'Counting' ? '#FCD116' : '#ffffff'}
        />
      ),
    },
    {
      title: 'Green Time',
      dataIndex: 'greenTime',
      key: 'greenTime',
      width: 120,
      render: (gt: number, row) =>
        row.detectionMode === 'Counting' ? (
          <span className='text-emerald-400 fs-12 font-semibold'>{gt}s</span>
        ) : (
          <span className='text-white/40 fs-12'>-</span>
        ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (v: number, row) =>
        row.detectionMode === 'Counting' ? (
          <span className='text-(--yellow) fs-12 font-semibold'>
            {v.toLocaleString()}
          </span>
        ) : (
          <span className='text-white/40 fs-12'>-</span>
        ),
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
    // IP Address is the LAST column on every detail-page table (2026-08-17
    // request, applied app-wide).
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => (
        <span className='text-white/80 fs-12'>{ip}</span>
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
      scroll={{ x: 1200 }}
      // Clicking a row opens the Live Stream modal — mirrors GRID tile behavior.
      onRow={(record) => ({
        onClick: () => onOpen(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}

export default React.memo<Props>(TableCameraTrafficSignal)
