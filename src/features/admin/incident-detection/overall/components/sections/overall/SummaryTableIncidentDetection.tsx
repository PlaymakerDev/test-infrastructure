"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentRow } from '@/features/admin/incident-detection/overall/data/incidentData'

interface Props {
  rows: IncidentRow[]
  loading?: boolean
}

/** Count cell — solid badge only for single-state rows (all online / all offline). */
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

const WarrantyPill: React.FC<{ warranty: IncidentRow['warranty'] }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
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

type TableRow =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; item: IncidentRow; roadCodeSpan: number }

const TOTAL_COLS = 8

/** Tab 1 — summary view (mirrors the traffic-signal summary table). */
const SummaryTableIncidentDetection: React.FC<Props> = ({ rows, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()

  const data = useMemo<TableRow[]>(() => {
    const groups = new Map<string, IncidentRow[]>()
    for (const r of rows) {
      const list = groups.get(r.bureau) ?? []
      list.push(r)
      groups.set(r.bureau, list)
    }
    const out: TableRow[] = []
    for (const [bureau, items] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })
      let i = 0
      while (i < items.length) {
        const code = items[i].roadCode
        let span = 1
        while (i + span < items.length && items[i + span].roadCode === code) span++
        out.push({ kind: 'project', id: items[i].id, item: items[i], roadCodeSpan: span })
        for (let j = 1; j < span; j++) {
          out.push({ kind: 'project', id: items[i + j].id, item: items[i + j], roadCodeSpan: 0 })
        }
        i += span
      }
    }
    return out
  }, [rows])

  const goToDetail = useCallback((r: IncidentRow) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/incident-detection/detail/${r.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])

  const columns: ColumnsType<TableRow> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      className: 'col-road-code',
      width: 160,
      onCell: (row) =>
        row.kind === 'bureau'
          ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
          : { rowSpan: row.roadCodeSpan },
      render: (_, row) => {
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
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.roadCode}
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
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.projectName}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 260,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.installPoint}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 200,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <ContractInfoCell
            contractNo={row.item.contractNo}
            budgetYear={row.item.budgetYear}
            projectId={row.item.projectId}
            roadId={row.item.roadId}
          />
        ) : null,
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 130,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <WarrantyPill warranty={row.item.warranty} /> : null),
    },
    {
      title: 'กล้องทั้งหมด',
      key: 'total',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? <span className='text-white font-semibold'>{row.item.totalCameras}</span> : null,
    },
    {
      title: 'ออนไลน์',
      key: 'online',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        const single = !(row.item.onlineCameras > 0 && row.item.offlineCameras > 0)
        return <CountBadge value={row.item.onlineCameras} color='#66AEFF' highlight={single} />
      },
    },
    {
      title: 'ออฟไลน์',
      key: 'offline',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        const single = !(row.item.onlineCameras > 0 && row.item.offlineCameras > 0)
        return <CountBadge value={row.item.offlineCameras} color='#E94C4C' highlight={single} />
      },
    },
  ], [goToDetail])

  return (
    <Table<TableRow>
      rowKey='id'
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1300 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(SummaryTableIncidentDetection)
