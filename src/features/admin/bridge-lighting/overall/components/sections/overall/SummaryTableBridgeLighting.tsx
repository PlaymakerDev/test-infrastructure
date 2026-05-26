"use client"
import React, { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import ModalInfoBridgeLighting from '@/features/admin/bridge-lighting/overall/components/ModalInfoBridgeLighting'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  /** Filtered + searched projects */
  projects: BridgeProject[]
}

/**
 * Count badge — colored chip that highlights when value > 0.
 * Used in the "summary" view to call out online/offline totals.
 */
const CountBadge: React.FC<{ value: number; color: string; highlight?: boolean }> = ({
  value,
  color,
  highlight,
}) => {
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

const WarrantyPill: React.FC<{ warranty: BridgeProject['warranty'] }> = ({ warranty }) => {
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

/** Single-table row — bureau divider or real project row.
 *  `roadCodeSpan` controls vertical cell merging in the `รหัสสายทาง` column
 *  (first row of a same-roadCode run = full span, others = 0 to hide). */
type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; project: BridgeProject; roadCodeSpan: number }

const SummaryTableBridgeLighting: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const [infoBridge, setInfoBridge] = useState<BridgeProject | null>(null)
  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, BridgeProject[]>()
    for (const p of projects) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }
    const out: Row[] = []
    for (const [bureau, items] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })

      // Within each bureau, merge consecutive rows that share the same
      // roadCode by assigning rowSpan to the first row and 0 to the rest.
      let i = 0
      while (i < items.length) {
        const code = items[i].roadCode
        let span = 1
        while (i + span < items.length && items[i + span].roadCode === code) {
          span++
        }
        out.push({
          kind: 'project',
          id: items[i].id,
          project: items[i],
          roadCodeSpan: span,
        })
        for (let j = 1; j < span; j++) {
          out.push({
            kind: 'project',
            id: items[i + j].id,
            project: items[i + j],
            roadCodeSpan: 0,
          })
        }
        i += span
      }
    }
    return out
  }, [projects])

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
          return row.project.roadCode
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'projectName',
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? row.project.projectName : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 280,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return (
            <span
              className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
              onClick={() =>
                router.push(`/admin/bridge-lighting/detail/${row.project.id}`)
              }
              role='link'
              tabIndex={0}
            >
              {row.project.installPoint}
            </span>
          )
        },
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 200,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
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
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? <WarrantyPill warranty={row.project.warranty} /> : null,
      },
      {
        title: 'ดวงไฟทั้งหมด',
        key: 'totalDevices',
        align: 'center',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold'>{row.project.totalDevices}</span>
          ) : null,
      },
      {
        title: 'ออนไลน์',
        key: 'onlineCount',
        align: 'center',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <CountBadge value={row.project.onlineCount} color='#66AEFF' highlight />
          ) : null,
      },
      {
        title: 'ออฟไลน์',
        key: 'offlineCount',
        align: 'center',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <CountBadge value={row.project.offlineCount} color='#E94C4C' highlight />
          ) : null,
      },
    ]
  }, [router])

  return (
    <>
      <Table<Row>
        rowKey='id'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        // Keep horizontal scroll inside the table on narrow viewports.
        // Using a specific min-width (instead of `max-content`) lets the
        // table fit the container on wide screens — `max-content` would
        // force the table to expand to its full natural width and overflow.
        scroll={{ x: 1300 }}
        className='bridge-projects-table'
      />
      <ModalInfoBridgeLighting bridge={infoBridge} onClose={() => setInfoBridge(null)} />
    </>
  )
}

export default React.memo<Props>(SummaryTableBridgeLighting)
