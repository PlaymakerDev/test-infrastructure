"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import type { Route } from '../../types/route'

interface Props {
  data: Route[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
}

const TableRoute: React.FC<Props> = ({ data, page, pageSize, onPageChange, onEdit, onDelete }) => {
  const columns: ColumnsType<Route> = useMemo(
    () => [
      {
        title: 'รหัสสายทาง',
        dataIndex: 'code',
        key: 'code',
        width: 140,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'ชื่อสายทาง',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
      {
        title: 'จังหวัด',
        dataIndex: 'province',
        key: 'province',
        width: 140,
      },
      {
        title: 'อำเภอ',
        dataIndex: 'district',
        key: 'district',
        width: 140,
        render: (v: string) => v || '-',
      },
      {
        title: 'ระยะทาง (กม.)',
        dataIndex: 'lengthKm',
        key: 'lengthKm',
        width: 140,
        align: 'right',
        render: (v: number) =>
          typeof v === 'number' && !Number.isNaN(v)
            ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '-',
      },
      {
        title: 'หน่วยงานรับผิดชอบ',
        dataIndex: 'responsibleOffice',
        key: 'responsibleOffice',
        width: 180,
      },
      {
        title: 'จัดการ',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_: unknown, row) => (
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => onEdit(row)}
              className='text-(--yellow) hover:opacity-80 cursor-pointer'
              title='แก้ไข'
            >
              <TbPencil size={18} />
            </button>
            <button
              type='button'
              onClick={() => onDelete(row)}
              className='text-(--red) hover:opacity-80 cursor-pointer'
              title='ลบ'
            >
              <TbTrash size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <Table<Route>
      rowKey='id'
      columns={columns}
      dataSource={data}
      size='middle'
      scroll={{ x: 1200 }}
      pagination={{
        current: page,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total.toLocaleString()}`,
      }}
    />
  )
}

export default React.memo<Props>(TableRoute)
