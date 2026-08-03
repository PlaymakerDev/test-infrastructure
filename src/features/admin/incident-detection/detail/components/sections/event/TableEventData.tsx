"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  getEventTypeColor,
  getEventTypeLabel,
} from '@/features/admin/incident-detection/components/eventTypes'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'
import { EventSnapshot, fmtThaiDate, fmtTime } from './EventGridView'

interface Props {
  events: IncidentTransactionItem[]
  loading?: boolean
  /** Open the event-detail modal for this row (snapshot click). */
  onSelect?: (ev: IncidentTransactionItem) => void
  /** Server-side pagination (the API is paginated — total comes from meta_data.count). */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number, pageSize: number) => void
}

/** Event-type pill — outlined, colored by the shared event-type palette. */
const EventTypePill: React.FC<{ id: number; label: string }> = ({ id, label }) => {
  const color = getEventTypeColor(id)
  return (
    <span
      className='inline-block py-0.5 px-3 rounded-full fs-12 whitespace-nowrap border'
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  )
}

/** Table view — flat list of events (Tab2 "table" mode). Pagination is handled
 *  by the parent (server-side), so this table itself never paginates. */
const TableEventData: React.FC<Props> = ({ events, loading, onSelect, page, pageSize, total, onPageChange }) => {
  const columns: ColumnsType<IncidentTransactionItem> = useMemo(() => [
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      width: 180,
      render: (_, r) => (
        <div>
          <p className='fs-12 mb-0'>{fmtThaiDate(r.date_time)}</p>
          <p className='fs-12 mb-0 text-white/60'>{fmtTime(r.date_time)}</p>
        </div>
      ),
    },
    {
      title: 'ประเภทเหตุการณ์',
      key: 'type',
      width: 200,
      render: (_, r) => (
        <EventTypePill
          id={r.analytic_type_info.id}
          label={getEventTypeLabel(r.analytic_type_info.id, r.analytic_type_info.analytic_type_name_th)}
        />
      ),
    },
    {
      title: 'ชื่อกล้อง',
      key: 'camera',
      width: 420,
      render: (_, r) => <span className='fs-12 text-white'>{r.camera.camera_name}</span>,
    },
    {
      title: 'IP Address',
      key: 'ip',
      width: 160,
      render: (_, r) => <span className='fs-12 text-white/70'>{r.camera.ip_address}</span>,
    },
    {
      title: 'ภาพขณะเกิดเหตุ',
      key: 'image',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <EventSnapshot
          url={r.image_path}
          className='inline-block w-25 h-15 rounded'
          onClick={onSelect ? () => onSelect(r) : undefined}
        />
      ),
    },
  ], [onSelect])

  return (
    <Table<IncidentTransactionItem>
      columns={columns}
      dataSource={events}
      rowKey='id'
      size='middle'
      loading={loading}
      scroll={{ x: 1100 }}
      className='bridge-projects-table'
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
        locale: { items_per_page: '/ หน้า' },
        onChange: onPageChange,
      }}
    />
  )
}

export default React.memo<Props>(TableEventData)
