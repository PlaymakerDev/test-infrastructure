"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import {
  groupByBureau,
  projectKey,
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
      className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${config.color}`, color: config.color }}
    >
      {config.text}
    </span>
  )
}

type Row = BureauGroupedRow<TrafficVolumeProject>

// Bureau-divider colSpan must match the number of VISIBLE columns.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 8 : 7

const SummaryTableTrafficVolume: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const goToDetail = useCallback((project: TrafficVolumeProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-volume/detail/${project.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])
  const data = useMemo<Row[]>(
    () => groupByBureau(projects, (p) => projectKey(p.projectId, p.contractNo)),
    [projects],
  )

  const columns: ColumnsType<Row> = useMemo(() => {
    const cols: ColumnsType<Row> = [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        className: 'col-road-code',
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
                  className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12'
                  style={{
                    border: '1px solid #fff',
                    color: '#fff',
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
        className: 'col-project-name',
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
    // ชื่อโครงการ hidden behind the app-wide flag — flip SHOW_PROJECT_NAME to restore.
    return SHOW_PROJECT_NAME ? cols : cols.filter((c) => c.title !== 'ชื่อโครงการ')
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
