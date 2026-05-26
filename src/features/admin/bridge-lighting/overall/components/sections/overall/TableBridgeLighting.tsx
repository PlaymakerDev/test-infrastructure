"use client"
import React, { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import ModalInfoBridgeLighting from '@/features/admin/bridge-lighting/overall/components/ModalInfoBridgeLighting'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  /** Filtered + searched projects */
  projects: BridgeProject[]
}

/**
 * Pill button — used for warranty + connection + stream cells.
 * Same look across the column for visual consistency with the design.
 */
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

/** Single-table row — either a bureau divider header or a real project row.
 *  Encoded as a discriminated union so the column renderers can branch on it
 *  while keeping everything in one continuous AntD `<Table>`.
 *
 *  `roadCodeSpan` on project rows controls vertical cell merging in the
 *  `รหัสสายทาง` column: the first row of a same-roadCode group carries the
 *  full span (e.g. 2), subsequent rows carry 0 (cell hidden via AntD's
 *  rowSpan=0 convention). */
type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; project: BridgeProject; roadCodeSpan: number }

const TableBridgeLighting: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const [infoBridge, setInfoBridge] = useState<BridgeProject | null>(null)
  // ── Build a flat list interleaving bureau dividers + project rows ──
  // This lets us render ONE continuous table (single yellow header) while
  // still showing the "ส่วนกลาง 12 โครงการ" group bars between sections.
  const data = useMemo<Row[]>(() => {
    // 1) Group projects by bureau (preserves insertion order in JS Map)
    const groups = new Map<string, BridgeProject[]>()
    for (const p of projects) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }

    const out: Row[] = []
    for (const [bureau, items] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })

      // 2) Within each bureau, scan consecutive runs of identical roadCode
      //    and assign rowSpan so the merged cell shows the code once.
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
            roadCodeSpan: 0, // hidden via rowSpan=0
          })
        }
        i += span
      }
    }
    return out
  }, [projects])

  const TOTAL_COLS = 7

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
          // Merge consecutive rows with the same `roadCode` so the code is
          // shown once spanning all sibling rows.
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
            <Pill text='เชื่อมต่อ' color='#05F2DB' />
          ) : (
            <Pill text='ไม่เชื่อมต่อ' color='#E94C4C' />
          )
        },
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
        // Horizontal scroll inside the table on narrow viewports.
        // Specific min-width (not `max-content`) lets the table fit the
        // container on wide screens instead of expanding to full natural width.
        scroll={{ x: 1260 }}
        // Class enables the yellow horizontal row dividers defined in
        // `src/styles/antd.css` under `.bridge-projects-table`.
        className='bridge-projects-table'
      />
      <ModalInfoBridgeLighting bridge={infoBridge} onClose={() => setInfoBridge(null)} />
    </>
  )
}

export default React.memo<Props>(TableBridgeLighting)
