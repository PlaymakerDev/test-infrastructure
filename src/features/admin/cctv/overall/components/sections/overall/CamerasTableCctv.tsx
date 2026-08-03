"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter, useSearchParams } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import type { CCTVOverviewRow } from '@/types/cctv/overview-api'

/** Count cell — the filled box appears only for single-state rows (all online
 *  OR all offline). A mixed row shows plain coloured numbers. */
const CountBadge: React.FC<{ value: number; color: string; highlight?: boolean }> = ({
  value,
  color,
  highlight,
}) => {
  if (value === 0) return <span style={{ color }}>{value}</span>
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

const WarrantyPill: React.FC<{ isWarranty: boolean }> = ({ isWarranty }) => {
  const cfg = isWarranty
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

/** Table row — a bureau (แขวง) divider header or a real solution row. */
type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; item: CCTVOverviewRow; roadCodeSpan: number }

// Visible column count — the bureau divider row spans all of them.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 8 : 7

interface Props {
  items: CCTVOverviewRow[]
  loading?: boolean
}

const CamerasTableCctv: React.FC<Props> = ({ items, loading }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToDetail = useCallback(
    (solutionId: number) => {
      const deptId = searchParams.get('dept_id')
      router.push(`/admin/cctv/detail/${solutionId}${deptId ? `?dept_id=${deptId}${scopeQuerySuffix()}` : ''}`)
    },
    [router, searchParams]
  )

  // Build a flat list interleaving bureau dividers + solution rows. Within a
  // bureau, consecutive rows sharing a road code merge via rowSpan so the code
  // shows once per group (same pattern as traffic-signal).
  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, CCTVOverviewRow[]>()
    for (const it of items) {
      const list = groups.get(it.bureau) ?? []
      list.push(it)
      groups.set(it.bureau, list)
    }
    const out: Row[] = []
    for (const [bureau, rows] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: rows.length })
      let i = 0
      while (i < rows.length) {
        const code = rows[i].road.code_name
        let span = 1
        while (i + span < rows.length && rows[i + span].road.code_name === code) span++
        out.push({ kind: 'project', id: String(rows[i].solution.id), item: rows[i], roadCodeSpan: span })
        for (let j = 1; j < span; j++) {
          out.push({ kind: 'project', id: String(rows[i + j].solution.id), item: rows[i + j], roadCodeSpan: 0 })
        }
        i += span
      }
    }
    return out
  }, [items])

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a filter toggle — merged cells then
  // overlap and the table visibly breaks. Remount whenever the merged-row
  // structure (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => data.map((d) => (d.kind === 'project' ? `${d.id}:${d.roadCodeSpan}` : d.id)).join('|'),
    [data],
  )

  const columns: ColumnsType<Row> = useMemo(() => ([
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      className: 'col-road-code',
      width: 160,
      onCell: (row) => {
        if (row.kind === 'bureau') {
          return { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
        }
        return { rowSpan: row.roadCodeSpan }
      },
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
          <DetailLinkText onClick={() => goToDetail(row.item.solution.id)}>
            {row.item.road.code_name}
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
      render: (_, row) =>
        row.kind === 'project' ? (
          <DetailLinkText onClick={() => goToDetail(row.item.solution.id)}>
            {row.item.project.project_name}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 280,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <DetailLinkText onClick={() => goToDetail(row.item.solution.id)}>
            {row.item.solution.solution_name}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 220,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <ContractInfoCell
            contractNo={row.item.project.contract_no}
            budgetYear={row.item.project.budget_year}
            projectId={row.item.project.id}
            roadId={row.item.road.id}
          />
        ) : null,
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 130,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <WarrantyPill isWarranty={row.item.is_warranty} /> : null),
    },
    {
      title: 'กล้องทั้งหมด',
      key: 'total',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <span className='text-white font-semibold'>{row.item.camera.total}</span>
        ) : null,
    },
    {
      title: 'ออนไลน์',
      key: 'online',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        const single = !(row.item.camera.online > 0 && row.item.camera.offline > 0)
        return <CountBadge value={row.item.camera.online} color='#66AEFF' highlight={single} />
      },
    },
    {
      title: 'ออฟไลน์',
      key: 'offline',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        const single = !(row.item.camera.online > 0 && row.item.camera.offline > 0)
        return <CountBadge value={row.item.camera.offline} color='#E94C4C' highlight={single} />
      },
    },
  ] satisfies ColumnsType<Row>).filter((c) => SHOW_PROJECT_NAME || c.title !== 'ชื่อโครงการ'), [goToDetail])

  return (
    <Table<Row>
      key={tableKey}
      rowKey='id'
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1350 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(CamerasTableCctv)
