"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { CrosswalkProject } from '@/features/admin/crosswalk/overall/data/crosswalk'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'

interface Props {
  /** Filtered + searched crosswalk projects */
  projects: CrosswalkProject[]
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

const CountBadge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  if (value === 0) return <span className='text-white/30'>{value}</span>
  return (
    <span
      className='inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded font-semibold'
      style={{ background: color, color: '#212121' }}
    >
      {value}
    </span>
  )
}

type Row = BureauGroupedRow<CrosswalkProject>

// Bureau header row spans every visible column — one less while ชื่อโครงการ is hidden.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 9 : 8

const TableCrosswalkData: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()

  const goToDetail = useCallback(
    (project: CrosswalkProject) => {
      // Same URL pattern as the other detail pages — dept_id only. The detail
      // page self-derives project_id / road_id from the central list.
      const params = new URLSearchParams({ dept_id: deptId })
      router.push(`/admin/crosswalk/detail/${project.id}?${params}${scopeQuerySuffix()}`)
    },
    [router, deptId],
  )

  const data = useMemo<Row[]>(() => groupByBureau(projects), [projects])

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a filter toggle — merged cells then
  // overlap and the table visibly breaks. Remount whenever the merged-row
  // structure (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => data.map((d) => (d.kind === 'project' ? `${d.id}:${d.roadCodeSpan}` : d.id)).join('|'),
    [data],
  )

  const columns: ColumnsType<Row> = useMemo(() => {
    const all: ColumnsType<Row> = [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        className: 'col-road-code',
        width: 130,
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
                  style={{ border: '1px solid #fff', color: '#fff' }}
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
              {row.project.projectName ?? '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 260,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.installPoint}
            </DetailLinkText>
          ) : null,
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
        title: 'สถานะ',
        key: 'connection',
        width: 140,
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
        title: 'กล้องทั้งหมด',
        key: 'totalCameras',
        width: 120,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='font-semibold'>{row.project.totalCameras}</span>
          ) : null,
      },
      {
        title: 'ออนไลน์',
        key: 'onlineCount',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <CountBadge value={row.project.onlineCount} color='#66AEFF' />
          ) : null,
      },
      {
        title: 'ออฟไลน์',
        key: 'offlineCount',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <CountBadge value={row.project.offlineCount} color='#E94C4C' />
          ) : null,
      },
    ]
    // ชื่อโครงการ hidden app-wide while SHOW_PROJECT_NAME is off.
    return SHOW_PROJECT_NAME ? all : all.filter((col) => col.key !== 'projectName')
  }, [goToDetail])

  return (
    <Table<Row>
      key={tableKey}
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      loading={loading}
      scroll={{ x: 1400 }}
      // Shared table skin — yellow row dividers + dark pagination styling.
      // Same class the traffic-volume overall / report tables use.
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableCrosswalkData)
