"use client"
import React, { useMemo, useState, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import DetailLinkText from '@/components/table/DetailLinkText'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import ModalInfoBridgeLighting from '@/features/admin/bridge-lighting/overall/components/ModalInfoBridgeLighting'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  /** Filtered + searched projects */
  projects: BridgeProject[]
  loading?: boolean
}

/** Outlined pill — reused across การค้ำประกัน / สถานะ / Stream cells. Same
 *  look as the crosswalk / traffic-signal / vms overall-list tables. */
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

type Row = BureauGroupedRow<BridgeProject>

const TOTAL_COLS = 7

const SummaryTableBridgeLighting: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const [infoBridge, setInfoBridge] = useState<BridgeProject | null>(null)

  const goToDetail = useCallback(
    (project: BridgeProject) => {
      router.push(`/admin/bridge-lighting/detail/${project.id}`)
    },
    [router],
  )

  // Interleave bureau dividers + project rows into ONE continuous table
  // (single yellow header) with road-code rowspans — via the shared helper
  // used by every overall list table, so the grouping algorithm lives once.
  const data = useMemo<Row[]>(() => groupByBureau(projects), [projects])

  const columns: ColumnsType<Row> = useMemo(
    () => [
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
        width: 280,
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
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          // Bridge-lighting keeps its own mock-backed project-info modal
          // (ModalInfoBridgeLighting) instead of the shared `ContractInfoCell`
          // — the mock has no project_id / road_id for the Redux modal to
          // resolve. Visual (contract number + inline info icon) matches
          // every other overall-list cell 1:1.
          return (
            <span className='inline-flex items-center gap-1.5'>
              {row.project.contractNo}
              <TbInfoSquareRoundedFilled
                size={18}
                className='text-white cursor-pointer hover:text-(--yellow)'
                title='ดูข้อมูลโครงการ'
                onClick={() => setInfoBridge(row.project)}
              />
            </span>
          )
        },
      },
      {
        title: 'การค้ำประกัน',
        key: 'warranty',
        width: 140,
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
        title: 'Stream',
        key: 'stream',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const isConnect = row.project.stream
          const color = isConnect ? '#66AEFF' : '#E94C4C'
          return (
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
              style={{ border: `1px solid ${color}`, color }}
            >
              {isConnect ? 'Connect' : 'Disconnect'}
            </span>
          )
        },
      },
    ],
    [goToDetail],
  )

  return (
    <>
      <Table<Row>
        rowKey='id'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        loading={loading}
        scroll={{ x: 1400 }}
        // Shared table skin — yellow row dividers + dark pagination styling
        // defined in `src/styles/antd.css` under `.bridge-projects-table`.
        className='bridge-projects-table'
      />
      <ModalInfoBridgeLighting bridge={infoBridge} onClose={() => setInfoBridge(null)} />
    </>
  )
}

export default React.memo<Props>(SummaryTableBridgeLighting)
