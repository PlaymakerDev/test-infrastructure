"use client"
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { groupLPRList, type LPRTableRow } from '../../../data/groupLPRList'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: ListData[]
  isLoading?: boolean
  isError?: boolean
}

const Pill: React.FC<{
  text: string
  color: string
  icon?: React.ReactNode
}> = ({ text, color, icon }) => (
  <span
    // className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
    className='inline-flex items-center gap-1 px-3 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

// Bureau divider row spans every visible column — one less while ชื่อโครงการ is hidden.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 9 : 8

/** Cells that describe the PROJECT (road code / name / contract / warranty) are
 *  merged across every install point of that project; the rest are per-row. */
const mergedCell = (row: LPRTableRow) =>
  row.kind === 'bureau' ? { colSpan: 0 } : { rowSpan: row.groupSpan }
const rowCell = (row: LPRTableRow) => (row.kind === 'bureau' ? { colSpan: 0 } : {})

/** Overall list table for LPR, grouped like the other overall menus:
 *  bureau divider ("N โครงการ") → project (road code / name / contract /
 *  warranty merged via rowSpan) → one row per install point. */
const TableLPRData: React.FC<Props> = ({ data, isLoading, isError }) => {
  const router = useRouter()
  const deptId = String(useDeptId() ?? '0')

  const rows = useMemo(() => groupLPRList(data), [data])

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a refetch — merged cells then overlap
  // and the table visibly breaks. Remount whenever the merged-row structure
  // (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => rows.map((r) => (r.kind === 'solution' ? `${r.id}:${r.groupSpan}` : r.id)).join('|'),
    [rows],
  )

  const goToDetail = useCallback(
    (item: SubDptSolution) => {
      router.push(`/admin/lpr/detail/${item.solution?.id}?dept_id=${deptId}&road_id=${item.road.id}${scopeQuerySuffix()}`)
    },
    [router, deptId],
  )

  const columns: ColumnsType<LPRTableRow> = useMemo(() => {
    const all: (ColumnsType<LPRTableRow>[number] & { key: string })[] = [
      {
        title: 'รหัสสายทาง',
        key: 'road_code',
        className: 'col-road-code',
        width: 130,
        onCell: (row) =>
          row.kind === 'bureau'
            ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
            : { rowSpan: row.groupSpan },
        render: (_, row) => {
          if (row.kind === 'bureau') {
            return (
              <div className='flex items-center gap-3'>
                <span className='text-white font-bold'>{row.bureau}</span>
                <span
                  className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12'
                  style={{ border: '1px solid #fff', color: '#fff' }}
                >
                  {row.count} โครงการ
                </span>
              </div>
            )
          }
          return (
            <DetailLinkText onClick={() => goToDetail(row.item)}>
              {row.item.road?.code_name || '-'}
            </DetailLinkText>
          )
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'project_name',
        className: 'col-project-name',
        ellipsis: true,
        onCell: mergedCell,
        render: (_, row) =>
          row.kind === 'solution' ? (
            <DetailLinkText onClick={() => goToDetail(row.item)}>
              {row.item.project?.project_name || '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contract_no',
        width: 200,
        onCell: mergedCell,
        render: (_, row) =>
          row.kind === 'solution' ? (
            <ContractInfoCell
              contractNo={row.item.project?.contract_no}
              budgetYear={row.item.project?.budget_year}
              projectId={row.item.project?.id}
              roadId={row.item.road?.id}
            />
          ) : null,
      },
      {
        title: 'การค้ำประกัน',
        key: 'is_warranty',
        width: 130,
        onCell: mergedCell,
        render: (_, row) => {
          if (row.kind !== 'solution') return null
          return row.item.is_warranty ? (
            <Pill text='ในค้ำ' color='#05F2DB' />
          ) : (
            <Pill text='หมดค้ำ' color='#979797' />
          )
        },
      },
      {
        title: 'จุดติดตั้ง',
        key: 'solution_name',
        width: 260,
        onCell: rowCell,
        render: (_, row) =>
          row.kind === 'solution' ? (
            <DetailLinkText onClick={() => goToDetail(row.item)}>
              {row.item.solution?.solution_name || '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'กล้องตรวจจับป้ายทะเบียน',
        key: 'total_camera',
        width: 200,
        onCell: rowCell,
        render: (_, row) =>
          row.kind === 'solution' ? (
            <span className='tabular-nums'>
              {(row.item.lpr?.total_camera ?? 0).toLocaleString('th-TH')}
            </span>
          ) : null,
      },
      {
        // The central-list contract carries camera counts only — no per-install-
        // point detected-plate total — so this column has nothing to bind to yet.
        title: 'ป้ายทะเบียน',
        key: 'total_detect_license',
        width: 130,
        onCell: rowCell,
        render: (_, row) =>
          row.kind === 'solution' ? (
            <span className='tabular-nums'>
              {fmtNumber(Number(row.item.plates.today))} คัน
            </span>
          ) : null
        ,
      },
      {
        title: 'สถานะ',
        key: 'status',
        width: 140,
        onCell: rowCell,
        render: (_, row) => {
          if (row.kind !== 'solution') return null
          return row.item.is_online ? (
            <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi className='fs-14' />} />
          ) : (
            <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff className='fs-14' />} />
          )
        },
      },
      {
        title: 'Stream',
        key: 'stream',
        width: 140,
        onCell: rowCell,
        render: (_, row) => {
          if (row.kind !== 'solution') return null
          return row.item.is_online ? (
            <Pill text='Connect' color='#66AEFF' />
          ) : (
            <Pill text='Disconnect' color='#E94C4C' />
          )
        },
      },
    ]
    // ชื่อโครงการ hidden app-wide while SHOW_PROJECT_NAME is off.
    return SHOW_PROJECT_NAME ? all : all.filter((col) => col.key !== 'project_name')
  }, [goToDetail])

  if (isError) return <Empty description="Error loading data" />

  return (
    <Table<LPRTableRow>
      key={tableKey}
      rowKey='id'
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      pagination={false}
      size='middle'
      scroll={{ x: 1500 }}
      locale={{ emptyText: 'ไม่พบข้อมูล' }}
      // Shared table skin — yellow row dividers + dark pagination styling.
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableLPRData)
