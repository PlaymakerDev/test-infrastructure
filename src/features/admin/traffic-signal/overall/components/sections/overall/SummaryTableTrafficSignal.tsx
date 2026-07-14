"use client"
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import type { TrafficSignalProject } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  /** Filtered + searched signal projects */
  projects: TrafficSignalProject[]
}

/**
 * Count badge — same shape as `SummaryTableBridgeLighting`:
 *   • value === 0 → colored bold text only (no badge)
 *   • value > 0 + highlight → solid-bg badge with dark text
 *   • value > 0 + no highlight → colored bold text
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

const WarrantyPill: React.FC<{ warranty: TrafficSignalProject['warranty'] }> = ({ warranty }) => {
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
 *  `roadCodeSpan` controls vertical cell merging in the `รหัสสายทาง` column. */
type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; project: TrafficSignalProject; roadCodeSpan: number }

const SummaryTableTrafficSignal: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const goToDetail = useCallback((project: TrafficSignalProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-signal/detail/${project.id}?${params}`)
  }, [router, deptId])
  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, TrafficSignalProject[]>()
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
          row.kind === 'project' ? <WarrantyPill warranty={row.project.warranty} /> : null,
      },
      {
        title: 'กล้องทั้งหมด',
        key: 'totalCameras',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold'>{row.project.totalCameras}</span>
          ) : null,
      },
      {
        title: 'ออนไลน์',
        key: 'onlineCameras',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          // Highlight (badge) only when one side is `0`; if both columns
          // have data, render both as plain colored text — the user wants
          // the badge to call out the "lopsided" rows where everything is
          // online or everything is offline.
          const bothActive =
            row.project.onlineCameras > 0 && row.project.offlineCameras > 0
          return (
            <CountBadge
              value={row.project.onlineCameras}
              color='#66AEFF'
              highlight={!bothActive}
            />
          )
        },
      },
      {
        title: 'ออฟไลน์',
        key: 'offlineCameras',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const bothActive =
            row.project.onlineCameras > 0 && row.project.offlineCameras > 0
          return (
            <CountBadge
              value={row.project.offlineCameras}
              color='#E94C4C'
              highlight={!bothActive}
            />
          )
        },
      },
    ]
  }, [goToDetail])

  return (
    <>
      <Table<Row>
        rowKey='id'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        // Same scroll x as bridge-lighting summary — keeps the table compact
        // enough to fit common viewports while allowing horizontal scroll on
        // narrow screens.
        scroll={{ x: 1300 }}
        className='bridge-projects-table'
      />
    </>
  )
}

export default React.memo<Props>(SummaryTableTrafficSignal)
