"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useLPRPoints } from '@/hooks/queries/lpr'

dayjs.extend(relativeTime)
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'

/** Sortable table view of every LPR install-point — same fields as the grid
 *  view (`LPRList`) but denser for desktop. Click a row → detail page for
 *  that solution (`/admin/lpr/detail/[solutionId]`). */
const TableLPRData: React.FC = () => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdFromUrl ?? '0')
  const { data: points, isLoading } = useLPRPoints()

  const rows = useMemo(() => {
    const all = points ?? []
    return (!deptId || deptId === '0'
      ? all
      : all.filter((p) => p.department_id === Number(deptId))
    ).map((p) => ({ key: String(p.solution_id), ...p }))
  }, [points, deptId])

  const columns: ColumnsType<LPRInstallPoint & { key: string }> = useMemo(
    () => [
      {
        title: 'รหัสสายทาง',
        dataIndex: 'road_code',
        key: 'road_code',
        width: 130,
        render: (v: string) => v || '-',
        sorter: (a, b) => (a.road_code ?? '').localeCompare(b.road_code ?? ''),
      },
      {
        title: 'จุดติดตั้ง',
        dataIndex: 'solution_name',
        key: 'solution_name',
        render: (v: string) => v || '-',
      },
      {
        title: 'ชื่อโครงการ',
        dataIndex: 'project_name',
        key: 'project_name',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: 'เลขที่สัญญา',
        dataIndex: 'contract_no',
        key: 'contract_no',
        width: 150,
        render: (v: string) => v || '-',
      },
      {
        title: 'กล้อง',
        dataIndex: 'camera_count',
        key: 'camera_count',
        width: 90,
        align: 'right',
        sorter: (a, b) => a.camera_count - b.camera_count,
        render: (n: number) => `${n.toLocaleString('th-TH')} ตัว`,
      },
      {
        title: 'ตรวจจับวันนี้',
        dataIndex: 'events_today',
        key: 'events_today',
        width: 130,
        align: 'right',
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.events_today - b.events_today,
        render: (n: number) => n.toLocaleString('th-TH'),
      },
      {
        title: 'ชั่วโมงล่าสุด',
        dataIndex: 'events_hour',
        key: 'events_hour',
        width: 130,
        align: 'right',
        sorter: (a, b) => a.events_hour - b.events_hour,
        render: (n: number) =>
          n > 0 ? (
            <Tag color='gold' style={{ margin: 0 }}>
              {n.toLocaleString('th-TH')}
            </Tag>
          ) : (
            <span className='text-gray-500'>0</span>
          ),
      },
      {
        title: 'ล่าสุด',
        dataIndex: 'latest_captured_at',
        key: 'latest_captured_at',
        width: 130,
        render: (v: string) => (v ? dayjs(v).locale('th').fromNow() : '-'),
      },
    ],
    [],
  )

  return (
    <Table
      rowKey='key'
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      size='middle'
      scroll={{ x: 1200 }}
      onRow={(row) => ({
        onClick: () =>
          router.push(
            `/admin/lpr/detail/${row.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
          ),
        className: 'cursor-pointer',
      })}
    />
  )
}

export default React.memo(TableLPRData)
