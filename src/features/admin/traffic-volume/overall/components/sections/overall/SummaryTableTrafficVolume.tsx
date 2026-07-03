"use client"
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { TrafficVolumeProject } from '@/features/admin/traffic-volume/overall/data/trafficVolumes'

interface Props {
  projects: TrafficVolumeProject[]
  loading?: boolean
}

const CountBadge: React.FC<{
  value: number
  color: string
  highlight?: boolean
}> = ({ value, color, highlight }) => {
  if (value === 0) {
    return <span style={{ color }}>{value}</span>
  }
  if (highlight) {
    return (
      <span
        className='inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded'
        style={{ background: color, color: '#212121', fontWeight: 600 }}
      >
        {value}
      </span>
    )
  }
  return <span style={{ color, fontWeight: 600 }}>{value}</span>
}

const WarrantyPill: React.FC<{
  warranty: TrafficVolumeProject['warranty']
}> = ({ warranty }) => {
  const config =
    warranty === 'in-warranty'
      ? { text: 'ในค้ำ', color: '#05F2DB' }
      : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${config.color}`, color: config.color }}
    >
      {config.text}
    </span>
  )
}

type Row = BureauGroupedRow<TrafficVolumeProject>

const SummaryTableTrafficVolume: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const goToDetail = useCallback((project: TrafficVolumeProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    if (project.projectId) params.set('project_id', project.projectId)
    if (project.roadId) params.set('road_id', project.roadId)
    router.push(`/admin/traffic-volume/detail/${project.id}?${params}`)
  }, [router, deptId])
  const data = useMemo<Row[]>(() => groupByBureau(projects), [projects])

  const TOTAL_COLS = 8

  const columns: ColumnsType<Row> = useMemo(() => {
    return [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        width: 180,
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
                  style={{
                    border: '1px solid var(--yellow)',
                    color: 'var(--yellow)',
                  }}
                >
                  {row.count} โครงการ
                </span>
              </div>
            )
          }
          return (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.roadCode}
            </DetailLinkText>
          )
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'projectName',
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.projectName}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 280,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.installPoint}
            </DetailLinkText>
          )
        },
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 200,
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
        width: 140,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <WarrantyPill warranty={row.project.warranty} />
          ) : null,
      },
      {
        title: 'อุปกรณ์ทั้งหมด',
        key: 'totalDevices',
        width: 140,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold'>
              {row.project.totalDevices}
            </span>
          ) : null,
      },
      {
        title: 'ออนไลน์',
        key: 'onlineDevices',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const bothActive =
            row.project.onlineDevices > 0 && row.project.offlineDevices > 0
          return (
            <CountBadge
              value={row.project.onlineDevices}
              color='#66AEFF'
              highlight={!bothActive}
            />
          )
        },
      },
      {
        title: 'ออฟไลน์',
        key: 'offlineDevices',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const bothActive =
            row.project.onlineDevices > 0 && row.project.offlineDevices > 0
          return (
            <CountBadge
              value={row.project.offlineDevices}
              color='#E94C4C'
              highlight={!bothActive}
            />
          )
        },
      },
    ]
  }, [goToDetail])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      loading={loading}
      scroll={{ x: 1300 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(SummaryTableTrafficVolume)
