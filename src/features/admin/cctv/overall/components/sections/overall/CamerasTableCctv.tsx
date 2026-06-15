"use client"
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import type { CctvDeptOverviewListItem } from '@/types/cctv'
import { useAppSelector } from '@/stores/hooks'


const CountBadge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  if (value === 0) return <span style={{ color }}>{value}</span>
  return (
    <span
      className='inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded'
      style={{ background: color, color: '#212121', fontWeight: 600 }}
    >
      {value}
    </span>
  )
}

const WarrantyPill: React.FC<{ isWarranty: boolean }> = ({ isWarranty }) => {
  const cfg = isWarranty
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

interface Props {
  items: CctvDeptOverviewListItem[]
}

const CamerasTableCctv: React.FC<Props> = ({ items }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loading = useAppSelector((s) => s.cctv.task_schedules.overviewList.loading)

  const goToDetail = useCallback(
    (solutionId: number) => {
      const deptId = searchParams.get('dept_id')
      const query = deptId ? `?dept_id=${deptId}` : ''
      router.push(`/admin/cctv/detail/${solutionId}${query}`)
    },
    [router, searchParams]
  )

  const columns: ColumnsType<CctvDeptOverviewListItem> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      align: 'center',
      width: 160,
      onCell: (row) => ({ onClick: () => goToDetail(row.solution.id), style: { cursor: 'pointer' } }),
      render: (_, row) => row.road.code_name,
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      align: 'center',
      ellipsis: true,
      onCell: (row) => ({ onClick: () => goToDetail(row.solution.id), style: { cursor: 'pointer' } }),
      render: (_, row) => row.solution.solution_name,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 280,
      align: 'center',
      onCell: (row) => ({ onClick: () => goToDetail(row.solution.id), style: { cursor: 'pointer' } }),
      render: (_, row) => row.solution.solution_name,
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 220,
      align: 'center',
      render: (_, row) => (
        <span className='inline-flex items-center gap-1.5'>
          {row.project.contract_no}
          <TbInfoSquareRoundedFilled
            size={18}
            className='text-white cursor-pointer hover:text-(--yellow)'
            title='ดูรายละเอียดสัญญา'
          />
        </span>
      ),
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      align: 'center',
      width: 130,
      render: (_, row) => <WarrantyPill isWarranty={row.is_warranty} />,
    },
    {
      title: 'กล้องทั้งหมด',
      key: 'total',
      align: 'center',
      width: 120,
      render: (_, row) => <span className='text-white font-semibold'>{row.camera.total}</span>,
    },
    {
      title: 'ออนไลน์',
      key: 'online',
      align: 'center',
      width: 110,
      render: (_, row) => <CountBadge value={row.camera.online} color='#66AEFF' />,
    },
    {
      title: 'ออฟไลน์',
      key: 'offline',
      align: 'center',
      width: 110,
      render: (_, row) => <CountBadge value={row.camera.offline} color='#E94C4C' />,
    },
  ], [goToDetail])

  return (
    <Table<CctvDeptOverviewListItem>
      rowKey={(row) => String(row.solution.id)}
      columns={columns}
      dataSource={items}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1350 }}
    />
  )
}

export default React.memo<Props>(CamerasTableCctv)
