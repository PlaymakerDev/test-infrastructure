"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { TunnelProject } from '@/features/admin/tunnel/overall/data/tunnel'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'

interface Props {
  /** Filtered + searched tunnel projects */
  projects: TunnelProject[]
  loading?: boolean
  /** Fired when the user clicks a link cell; parent opens the viewer modal. */
  onOpenTunnel: (project: TunnelProject) => void
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

type Row = BureauGroupedRow<TunnelProject>

// Bureau header row spans every visible column — one less while ชื่อโครงการ is hidden.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 8 : 7

const TableTunnelData: React.FC<Props> = ({ projects, loading, onOpenTunnel }) => {
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
            <DetailLinkText onClick={() => onOpenTunnel(row.project)}>
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
            <DetailLinkText onClick={() => onOpenTunnel(row.project)}>
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
            <DetailLinkText onClick={() => onOpenTunnel(row.project)}>
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
        title: 'ไฟส่องสว่าง',
        key: 'totalLighting',
        width: 120,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='font-semibold'>{row.project.totalLighting}</span>
          ) : null,
      },
    ]
    // ชื่อโครงการ hidden app-wide while SHOW_PROJECT_NAME is off.
    return SHOW_PROJECT_NAME ? all : all.filter((col) => col.key !== 'projectName')
  }, [onOpenTunnel])

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
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableTunnelData)
