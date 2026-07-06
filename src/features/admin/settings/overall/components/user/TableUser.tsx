"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import type { User } from '../../types/user'
import RoleBadge from './RoleBadge'
import StatusPill from './StatusPill'

interface Props {
  data: User[]
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const buddhistYear = d.year() + 543
  const time = d.format('HH:mm')
  return `${d.date()} ${MONTHS[d.month()]} ${buddhistYear.toString().slice(-4)} ${time}`
}

const TableUser: React.FC<Props> = ({ data, page, pageSize, onPageChange, onEdit, onDelete }) => {
  const columns: ColumnsType<User> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        width: 160,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'ชื่อ-นามสกุล',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 200,
      },
      {
        title: 'อีเมล',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        ellipsis: true,
      },
      {
        title: 'บทบาท',
        dataIndex: 'role',
        key: 'role',
        width: 140,
        render: (v: User['role']) => <RoleBadge role={v} />,
      },
      {
        title: 'หน่วยงาน',
        dataIndex: 'department',
        key: 'department',
        width: 180,
        ellipsis: true,
      },
      {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (v: User['status']) => <StatusPill status={v} />,
      },
      {
        title: 'เข้าใช้งานล่าสุด',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 180,
        render: formatDateTime,
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
    <Table<User>
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

export default React.memo<Props>(TableUser)
