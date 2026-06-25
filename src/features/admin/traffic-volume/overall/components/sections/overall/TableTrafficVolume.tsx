"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import {
  TbShieldCheckFilled,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import { useDeptId } from '@/hooks/useDeptId'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { TrafficVolumeProject } from '@/features/admin/traffic-volume/overall/data/trafficVolumes'

interface Props {
  /** Filtered + searched traffic-volume projects */
  projects: TrafficVolumeProject[]
  loading?: boolean
}

const Pill: React.FC<{
  text: string
  color: string
  icon?: React.ReactNode
}> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

type Row = BureauGroupedRow<TrafficVolumeProject>

const TableTrafficVolume: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const data = useMemo<Row[]>(() => groupByBureau(projects), [projects])

  const TOTAL_COLS = 10

  const columns: ColumnsType<Row> = useMemo(() => {
    return [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        width: 140,
        onCell: (row) => {
          if (row.kind === 'bureau') {
            return {
              colSpan: TOTAL_COLS,
              style: { background: '#2a2a2a', padding: '10px 16px' },
            }
          }
          return { rowSpan: row.roadCodeSpan }
        },
        render: (_: unknown, row: Row) => {
          if (row.kind === 'bureau') {
            return (
              <div className='flex items-center gap-3'>
                <span className='text-white font-bold'>{row.bureau}</span>
                <span
                  className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
                  style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
                >
                  {row.count} โครงการ
                </span>
              </div>
            )
          }
          return row.project.roadCode
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'projectName',
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (row.project.projectName ?? '-') : null,
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 180,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <ContractInfoCell
              contractNo={row.project.contractNo}
              budgetYear={row.project.budgetYear}
              projectId={row.project.projectId}
              roadId={row.project.roadId}
            />
          ) : null,
      },
      {
        title: 'การค้ำประกัน',
        key: 'warranty',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return row.project.warranty === 'in-warranty' ? (
            <Pill text='ในค้ำ' color='#05F2DB' />
          ) : (
            <Pill text='หมดค้ำ' color='#979797' />
          )
        },
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 260,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return (
            <span
              className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
              onClick={() => {
                // Pass project_id + road_id (+ dept_id) so the detail page can
                // open the central Project Info modal without re-fetching.
                const params = new URLSearchParams({ dept_id: deptId })
                if (row.project.projectId)
                  params.set('project_id', row.project.projectId)
                if (row.project.roadId)
                  params.set('road_id', row.project.roadId)
                router.push(
                  `/admin/traffic-volume/detail/${row.project.id}?${params}`
                )
              }}
              role='link'
              tabIndex={0}
            >
              {row.project.installPoint}
            </span>
          )
        },
      },
      {
        title: 'กล้องนับรถ',
        key: 'totalDevices',
        width: 110,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold'>
              {row.project.totalDevices}
            </span>
          ) : null,
      },
      {
        title: 'ปริมาณจราจร',
        key: 'trafficVolume',
        width: 130,
        align: 'right',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const v = row.project.trafficCount
          return v == null ? (
            <span className='text-gray-500'>-</span>
          ) : (
            <span className='text-white'>{v.toLocaleString()} คัน</span>
          )
        },
      },
      {
        title: 'License',
        key: 'license',
        width: 90,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        // Mirrors `is_warranty` visually — yellow when active, gray when not.
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const active = row.project.warranty === 'in-warranty'
          return (
            <TbShieldCheckFilled
              size={20}
              className='inline-block'
              style={{ color: active ? '#FCD116' : '#979797' }}
              title={active ? 'License Active' : 'License Inactive'}
            />
          )
        },
      },
      {
        title: 'สถานะ',
        key: 'connection',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return row.project.connection === 'online' ? (
            <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi size={14} />} />
          ) : (
            <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff size={14} />} />
          )
        },
      },
      {
        title: 'Stream',
        key: 'stream',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return row.project.stream ? (
            <Pill text='Connect' color='#66AEFF' icon={<TbWifi size={14} />} />
          ) : (
            <Pill text='Disconnect' color='#E94C4C' icon={<TbWifiOff size={14} />} />
          )
        },
      },
    ]
  }, [router, deptId])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      loading={loading}
      scroll={{ x: 1500 }}
      className='bridge-projects-table'
      rowClassName={(row) => (row.kind === 'project' ? 'project-row' : '')}
    />
  )
}

export default React.memo<Props>(TableTrafficVolume)
