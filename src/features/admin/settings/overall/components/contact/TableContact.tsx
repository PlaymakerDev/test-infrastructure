"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import type { Contractor } from '../../types/contractor'
import { PAGE_SIZE_OPTIONS } from '../../utils/paginationConfig'

interface Props {
  data: Contractor[]
  loading?: boolean
  page: number
  pageSize: number
  /** Server-reported total row count (meta_data.count). Feeds AntD's
   *  pagination `total` so the page-number bar reflects the full dataset
   *  even though `data` only carries the current page's slice. */
  total: number
  /** Body-scroll height in px — computed by parent from container height
   *  so the table body fits inside the viewport slot without pushing
   *  pagination off-screen. */
  scrollY: number
  onPageChange: (page: number) => void
  /** Fires when the pageSize dropdown value changes (AntD onShowSizeChange
   *  callback). Parent resets `page` to 1 to avoid stranding the user. */
  onPageSizeChange?: (size: number) => void
  onEdit: (row: Contractor) => void
  onDelete: (row: Contractor) => void
}

/** Format an ISO datetime as Thai Buddhist-era short date (dd/MM/BE). Falls
 *  back to the raw string on any parse failure so the cell is never empty. */
const formatThaiDate = (iso: string): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const be = d.getFullYear() + 543
  return `${dd}/${mm}/${be}`
}

const TableContact: React.FC<Props> = ({
  data,
  loading,
  page,
  pageSize,
  total,
  scrollY,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<Contractor> = useMemo(
    () => [
      {
        title: 'ชื่อบริษัท',
        dataIndex: 'companyName',
        key: 'companyName',
        width: 280,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'ชื่อย่อ',
        dataIndex: 'shortName',
        key: 'shortName',
        width: 140,
        render: (v: string) => v || '-',
      },
      {
        title: 'ผู้ติดต่อ',
        dataIndex: 'contactPerson',
        key: 'contactPerson',
        width: 160,
        render: (v: string) => v || '-',
      },
      {
        title: 'เบอร์โทรศัพท์',
        dataIndex: 'phone',
        key: 'phone',
        width: 150,
        render: (v: string) => v || '-',
      },
      {
        title: 'ตำแหน่ง / บทบาท',
        dataIndex: 'role',
        key: 'role',
        width: 160,
        render: (v: string) => v || '-',
      },
      {
        title: 'วันที่ลงทะเบียน',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 140,
        render: (v: string) => formatThaiDate(v),
      },
      {
        title: 'จำนวนโครงการ',
        dataIndex: 'projectCount',
        key: 'projectCount',
        width: 130,
        align: 'center',
        render: (v: number) => (
          <span
            className='inline-flex items-center justify-center px-3 py-1 rounded-full fs-12 whitespace-nowrap'
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
      loading={loading}
      size='middle'
      scroll={{ x: 1400, y: scrollY }}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: (p, ps) => {
          onPageChange(p)
          // AntD merges page + pageSize change into a single `onChange` when
          // the user picks a new size from the dropdown — propagate the size
          // too so the parent stays in sync (even if the user clicks a page
          // number, `ps` will equal current `pageSize` so this is a no-op).
          if (ps !== pageSize) onPageSizeChange?.(ps)
        },
        onShowSizeChange: (_current, size) => onPageSizeChange?.(size),
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (t, range) => `${range[0]}-${range[1]} จาก ${t.toLocaleString()}`,
        placement: ['bottomEnd'],
      }}
    />
  )
}

export default React.memo<Props>(TableContact)
