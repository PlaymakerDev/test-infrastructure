"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbKey, TbPencil, TbTrash } from 'react-icons/tb'
import type { User } from '../../types/user'
import { PAGE_SIZE_OPTIONS } from '../../utils/paginationConfig'
import RoleBadge from './RoleBadge'
import StatusPill from './StatusPill'

interface Props {
  data: User[]
  page: number
  pageSize: number
  /** Server-reported total row count (data.meta_data.count). When absent,
   *  the AntD Table falls back to dataSource.length. */
  total?: number
  loading?: boolean
  /** Numeric px height forwarded to AntD's `scroll.y` so the body scrolls
   *  inside the card instead of the whole page. Derived by the parent from
   *  its measured container height via `calcTableScrollY`. */
  scrollY: number
  onPageChange: (p: number) => void
  /** Fires whenever the user picks a new page size from the AntD dropdown.
   *  Parent typically resets `page` to 1 to avoid orphaned deep pages. */
  onPageSizeChange?: (newSize: number) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onChangePassword: (user: User) => void
}

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// Small local pill — mirrors the outlined-chip pattern used by StatusPill/RoleBadge
// so the "ประเภท" column reads visually consistent with its neighbours.
const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center justify-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {text}
  </span>
)

const formatDate = (iso: string | null) => {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const buddhistYear = d.year() + 543
  return `${d.date()} ${MONTHS[d.month()]} ${buddhistYear.toString().slice(-4)}`
}

const TableUser: React.FC<Props> = ({
  data,
  page,
  pageSize,
  total,
  loading,
  scrollY,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onChangePassword,
}) => {
  const columns: ColumnsType<User> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        width: 180,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'ชื่อ-นามสกุล',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 220,
      },
      {
        title: 'บทบาท',
        dataIndex: 'role',
        key: 'role',
        width: 160,
        render: (v: User['role']) => <RoleBadge role={v} />,
      },
      {
        title: 'ประเภท',
        dataIndex: 'isLdap',
        key: 'isLdap',
        width: 100,
        render: (v: User['isLdap']) =>
          v ? <Pill text='LDAP' color='#66AEFF' /> : <Pill text='Local' color='#8A8A8A' />,
      },
      {
        title: 'หน่วยงาน',
        dataIndex: 'department',
        key: 'department',
        width: 220,
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
        title: 'สร้างเมื่อ',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: formatDate,
      },
      {
        title: 'จัดการ',
        key: 'actions',
        width: 140,
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
              onClick={() => onChangePassword(row)}
              className='text-(--default-blue) hover:opacity-80 cursor-pointer'
              title='เปลี่ยนรหัสผ่าน'
            >
              <TbKey size={18} />
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
    [onEdit, onChangePassword, onDelete],
  )

  return (
    <Table<User>
      rowKey='id'
      columns={columns}
      dataSource={data}
      size='middle'
      loading={loading}
      scroll={{ x: 1500, y: scrollY }}
      pagination={{
        current: page,
        pageSize,
        total,
        // Ant's `onChange` receives both the new page AND the new pageSize;
        // when the user changes only the size we still want to notify the
        // parent so it can reset to page 1 (the pattern used across tabs).
        onChange: (nextPage, nextPageSize) => {
          if (nextPageSize !== pageSize) onPageSizeChange?.(nextPageSize)
          onPageChange(nextPage)
        },
        onShowSizeChange: (_current, size) => {
          onPageSizeChange?.(size)
        },
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (n, range) => `${range[0]}-${range[1]} จาก ${n.toLocaleString()}`,
        placement: ['bottomEnd'],
      }}
    />
  )
}

export default React.memo<Props>(TableUser)
