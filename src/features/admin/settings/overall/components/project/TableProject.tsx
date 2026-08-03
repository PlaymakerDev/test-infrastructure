"use client"
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import { useOverallContext } from '../../context'
import type { Project } from '../../types/project'
import { PAGE_SIZE_OPTIONS } from '../../utils/paginationConfig'
import StatusBadge from './StatusBadge'

interface Props {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  scrollY: number
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  // Buddhist year — DRR uses พ.ศ. across the app
  const buddhistYear = d.year() + 543
  const monthMap = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${d.date()} ${monthMap[d.month()]} ${buddhistYear.toString().slice(-4)}`
}

const TableProject: React.FC<Props> = ({ onEdit, onDelete, scrollY }) => {
  const router = useRouter()
  const {
    filtered,
    page,
    pageSize,
    setPage,
    setPageSize,
    total,
    isLoading,
    isError,
    errorMessage,
  } = useOverallContext()

  const goToDetail = useCallback(
    (project: Project) => {
      router.push(`/admin/settings/detail/project?id=${project.id}`)
    },
    [router],
  )

  const columns: ColumnsType<Project> = useMemo(
    () => [
      {
        title: 'ผู้รับจ้าง',
        dataIndex: 'contractor',
        key: 'contractor',
        width: 200,
        render: (v: string, row) => (
          <span
            className='text-white cursor-pointer hover:opacity-80'
            onClick={() => goToDetail(row)}
          >
            {v}
          </span>
        ),
      },
      {
        title: 'รหัสโครงการ',
        dataIndex: 'code',
        key: 'code',
        width: 140,
      },
      {
        title: 'ชื่อโครงการ',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (v: string, row) => (
          <span
            className='cursor-pointer hover:text-(--yellow)'
            onClick={() => goToDetail(row)}
          >
            {v}
          </span>
        ),
      },
      {
        title: 'ผู้ว่าจ้าง',
        dataIndex: 'owner',
        key: 'owner',
        width: 150,
      },
      {
        title: 'เลขที่สัญญา',
        dataIndex: 'contractNo',
        key: 'contractNo',
        width: 160,
      },
      {
        title: 'วันที่เริ่มต้นค้ำประกัน',
        dataIndex: 'warrantyStart',
        key: 'warrantyStart',
        width: 170,
        render: formatDate,
      },
      {
        title: 'วันที่สิ้นสุดค้ำประกัน',
        dataIndex: 'warrantyEnd',
        key: 'warrantyEnd',
        width: 170,
        render: formatDate,
      },
      {
        title: 'สถานะการค้ำประกัน',
        dataIndex: 'warrantyStatus',
        key: 'warrantyStatus',
        width: 160,
        render: (v: Project['warrantyStatus']) => <StatusBadge status={v} />,
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
    [goToDetail, onEdit, onDelete],
  )

  return (
    <>
      {isError && (
        <div
          className='mb-3 rounded-lg px-3 py-2 fs-12'
          style={{ background: 'rgba(255,102,102,0.1)', color: '#FF6666', border: '1px solid #FF6666' }}
        >
          {errorMessage ?? 'ไม่สามารถโหลดข้อมูลโครงการได้'}
        </div>
      )}
      <Table<Project>
        rowKey='id'
        columns={columns}
        dataSource={filtered}
        loading={isLoading}
        size='middle'
        scroll={{ x: 1500, y: scrollY }}
        pagination={{
          current: page,
          pageSize,
          // Server-side pagination: without `total`, AntD infers it from
          // `dataSource.length` (the current page) and the pager thinks
          // there's only one page.
          total,
          onChange: (p, ps) => {
            setPage(p)
            if (ps !== pageSize) setPageSize(ps)
          },
          onShowSizeChange: (_p, ps) => setPageSize(ps),
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (t, range) => `${range[0]}-${range[1]} จาก ${t.toLocaleString()}`,
          placement: ['bottomEnd'],
        }}
      />
    </>
  )
}

export default React.memo<Props>(TableProject)
