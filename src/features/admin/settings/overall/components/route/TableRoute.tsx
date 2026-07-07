"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import type { Route } from '../../types/route'
import { PAGE_SIZE_OPTIONS } from '../../utils/paginationConfig'

interface Props {
  /** Current page rows (already filtered client-side for province + dept). */
  data: Route[]
  /** 1-indexed current page from RouteSection. */
  page: number
  pageSize: number
  /** Total row count from `meta_data.count` — drives pager length. */
  total: number
  /** Fires for page navigation (Ant `Pagination.onChange`). */
  onPageChange: (page: number, pageSize: number) => void
  /** Fires when the user picks a new page-size from the dropdown. */
  onPageSizeChange?: (pageSize: number) => void
  /** Measured px used for AntD `scroll.y` — table body scrolls inside container. */
  scrollY: number
  /** True while any /manage/roads fetch is inflight (initial or refetch). */
  loading?: boolean
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
}

const TableRoute: React.FC<Props> = ({
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  scrollY,
  loading,
  onEdit,
  onDelete,
}) => {
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
      scroll={{ x: 1200, y: scrollY }}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        // AntD calls onShowSizeChange with (currentPage, newSize) when the
        // page-size dropdown changes. We forward only the size — the parent
        // resets the page.
        onShowSizeChange: (_p, ps) => onPageSizeChange?.(ps),
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        // Server owns pagination — total refers to full dataset, not
        // `data.length` (which is only the current page after client filters).
        showTotal: (t, range) => `${range[0]}-${range[1]} จาก ${t.toLocaleString()}`,
        placement: ['bottomEnd'],
      }}
    />
  )
}

export default React.memo<Props>(TableRoute)
