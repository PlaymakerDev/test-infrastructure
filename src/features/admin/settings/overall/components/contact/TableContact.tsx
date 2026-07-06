"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import type { Contractor } from '../../types/contractor'

interface Props {
  data: Contractor[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onEdit: (row: Contractor) => void
  onDelete: (row: Contractor) => void
}

const TableContact: React.FC<Props> = ({ data, page, pageSize, onPageChange, onEdit, onDelete }) => {
  const columns: ColumnsType<Contractor> = useMemo(
    () => [
      {
        title: 'ชื่อบริษัท',
        dataIndex: 'companyName',
        key: 'companyName',
        width: 260,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'เลขประจำตัวผู้เสียภาษี',
        dataIndex: 'taxId',
        key: 'taxId',
        width: 180,
      },
      {
        title: 'ผู้ติดต่อ',
        dataIndex: 'contactPerson',
        key: 'contactPerson',
        width: 160,
      },
      {
        title: 'เบอร์โทรศัพท์',
        dataIndex: 'phone',
        key: 'phone',
        width: 150,
      },
      {
        title: 'อีเมล',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        render: (v: string) => v || '-',
      },
      {
        title: 'จังหวัด',
        dataIndex: 'province',
        key: 'province',
        width: 150,
      },
      {
        title: 'จำนวนโครงการ',
        dataIndex: 'projectCount',
        key: 'projectCount',
        width: 130,
        align: 'center',
        render: (v: number) => (
          <span
            className='inline-flex items-center justify-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
            style={{
              border: `1px solid ${v > 0 ? '#66AEFF' : 'var(--light-gray-2)'}`,
              color: v > 0 ? '#66AEFF' : '#B0B0B0',
              minWidth: 40,
            }}
          >
            {v.toLocaleString()}
          </span>
        ),
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
    <Table<Contractor>
      rowKey='id'
      columns={columns}
      dataSource={data}
      size='middle'
      scroll={{ x: 1400 }}
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

export default React.memo<Props>(TableContact)
