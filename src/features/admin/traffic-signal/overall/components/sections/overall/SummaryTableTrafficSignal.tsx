"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
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
  const dispatch = useAppDispatch()
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
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: row.project.projectId
                        ? Number(row.project.projectId)
                        : null,
                      road_id: row.project.roadId ? Number(row.project.roadId) : null,
                    }),
                  )
                }
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
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 280,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          return (
            <span
              className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
              onClick={() => {
                const params = new URLSearchParams({ dept_id: deptId })
                if (row.project.projectId) params.set('project_id', row.project.projectId)
                if (row.project.roadId) params.set('road_id', row.project.roadId)
                router.push(`/admin/traffic-signal/detail/${row.project.id}?${params}`)
              }}
              role='link'
              tabIndex={0}
            >
              {row.project.installPoint}
            </span>
          )
        },
      },
      {
        title: 'กล้องทั้งหมด',
        key: 'totalCameras',
        align: 'center',
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
        align: 'center',
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
        align: 'center',
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
  }, [router])

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
