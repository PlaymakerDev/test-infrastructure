"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import type { TrafficSignalProject } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  /** Filtered + searched signal projects */
  projects: TrafficSignalProject[]
}

/** Outlined pill — reused across warranty / status / stream / mode cells. */
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

/** Single-table row — either a bureau divider or a real project row. */
type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | {
      kind: 'project'
      id: string
      project: TrafficSignalProject
      roadCodeSpan: number
    }

// One color per controller mode so the table is easy to scan at a glance.
// `Auto` and `Flashing24Hr` share the "default" white pill — they're neutral
// states that don't need to pop visually.
const MODE_COLORS: Record<TrafficSignalProject['operatingMode'], string> = {
  FixedTime: '#05F2DB',     // cyan
  Adaptive_ET: '#FCD116',   // amber (highlight: smartest mode)
  Auto: '#FFFFFF',          // white
  Flashing24Hr: '#FFFFFF',  // white
}

// Bureau-divider colSpan must match the number of VISIBLE columns.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 9 : 8

const TableTrafficSignal: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const deptId = useDeptId()
  // Navigate to a project's detail page — passes project_id + road_id (+ dept_id)
  // so the detail page can open the central Project Info modal without re-fetching.
  const goToDetail = useCallback((project: TrafficSignalProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-signal/detail/${project.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])
  // ── Build a flat list interleaving bureau dividers + project rows.
  // Within each bureau, consecutive rows that share a roadCode are merged
  // via `rowSpan` so the route code is shown once per group.
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

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a filter toggle — merged cells then
  // overlap and the table visibly breaks. Remount whenever the merged-row
  // structure (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => data.map((d) => (d.kind === 'project' ? `${d.id}:${d.roadCodeSpan}` : d.id)).join('|'),
    [data],
  )

  const columns: ColumnsType<Row> = useMemo(() => {
    const cols: ColumnsType<Row> = [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        className: 'col-road-code',
        width: 160,
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
        width: 180,
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
        title: 'Phase',
        key: 'phase',
        width: 90,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white'>{row.project.phase}</span>
          ) : null,
      },
      {
        title: 'สถานะ',
        key: 'connection',
        width: 120,
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
            <Pill text='เชื่อมต่อ' color='#66AEFF' />
          ) : (
            <Pill text='ไม่เชื่อมต่อ' color='#E94C4C' />
          )
        },
      },
      {
        title: 'โหมดการทำงาน',
        key: 'operatingMode',
        width: 140,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          // Fall back to white border for unknown modes so the pill always
          // renders consistently — never plain text.
          return (
            <Pill
              text={row.project.operatingMode}
              color={MODE_COLORS[row.project.operatingMode] ?? '#FFFFFF'}
            />
          )
        },
      },
    ]
    // ชื่อโครงการ hidden behind the app-wide flag — flip SHOW_PROJECT_NAME to restore.
    return SHOW_PROJECT_NAME ? cols : cols.filter((c) => c.title !== 'ชื่อโครงการ')
  }, [goToDetail])

  return (
    <>
      <Table<Row>
        key={tableKey}
        rowKey='id'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        // Stay inside the table on narrow viewports.
        scroll={{ x: 1400 }}
        // Class enables the yellow row dividers shared with bridge-lighting
        // (defined in `src/styles/antd.css` under `.bridge-projects-table`).
        className='bridge-projects-table'
        // Tag project rows so CSS can force a transparent cell background.
        rowClassName={(row) =>
          row.kind === 'project' ? 'project-row' : ''
        }
      />
    </>
  )
}

export default React.memo<Props>(TableTrafficSignal)
