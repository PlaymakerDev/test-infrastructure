"use client"
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'

dayjs.extend(relativeTime)
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import type { LPRRow } from '../../../data/lprRows'
import { countDistinctProjects, projectKey } from '@/features/admin/traffic-volume/shared/utils/groupByBureau'

/** Table row — a bureau (ขทช.) divider header or a real install-point row.
 *  Same interleaved shape as cctv / incident-detection / traffic-signal. */
type TableRow =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; item: LPRRow; roadCodeSpan: number }

// Visible column count — the bureau divider row spans all of them.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 8 : 7

interface Props {
  /** Filtered + display-ordered rows from DataDisplaySection. */
  rows: LPRRow[]
  loading?: boolean
}

/** Overall list table for LPR install-points, following the shared overall-
 *  table pattern (cctv / incident-detection / traffic-signal): bureau divider
 *  rows + road-code rowSpan merge + DetailLinkText link cells +
 *  ContractInfoCell + `.bridge-projects-table` skin, no column sorters. */
const TableLPRData: React.FC<Props> = ({ rows, loading }) => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdFromUrl ?? '0')

  // Interleave bureau dividers + install-point rows. The incoming list is
  // already sorted bureau → road code, so consecutive same-code rows merge
  // via rowSpan (the code shows once per group — same as the sibling menus).
  const data = useMemo<TableRow[]>(() => {
    const groups = new Map<string, LPRRow[]>()
    for (const r of rows) {
      const list = groups.get(r.bureau) ?? []
      list.push(r)
      groups.set(r.bureau, list)
    }
    const out: TableRow[] = []
    for (const [bureau, items] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: countDistinctProjects(items, (r) => projectKey(r.project_id, r.contract_no)) })
      let i = 0
      while (i < items.length) {
        const code = items[i].road_code
        let span = 1
        while (i + span < items.length && items[i + span].road_code === code) span++
        out.push({ kind: 'project', id: String(items[i].solution_id), item: items[i], roadCodeSpan: span })
        for (let j = 1; j < span; j++) {
          out.push({ kind: 'project', id: String(items[i + j].solution_id), item: items[i + j], roadCodeSpan: 0 })
        }
        i += span
      }
    }
    return out
  }, [rows])

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a filter toggle — merged cells then
  // overlap and the table visibly breaks. Remount whenever the merged-row
  // structure (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => data.map((d) => (d.kind === 'project' ? `${d.id}:${d.roadCodeSpan}` : d.id)).join('|'),
    [data],
  )

  const goToDetail = useCallback(
    (item: LPRRow) => {
      router.push(
        `/admin/lpr/detail/${item.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
      )
    },
    [router, deptId],
  )

  const columns: ColumnsType<TableRow> = useMemo(
    () => ([
      {
        title: 'รหัสสายทาง',
        key: 'road_code',
        className: 'col-road-code',
        width: 150,
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
              {row.item.road_code || '-'}
            </DetailLinkText>
          )
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'project_name',
        className: 'col-project-name',
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.item)}>
              {row.item.project_name || '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'solution_name',
        width: 240,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.item)}>
              {row.item.solution_name || '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contract_no',
        width: 190,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) =>
          row.kind === 'project' ? (
            <ContractInfoCell
              contractNo={row.item.contract_no}
              projectId={row.item.project_id}
              roadId={row.item.road_id}
            />
          ) : null,
      },
      {
        title: 'กล้อง',
        key: 'camera_count',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold tabular-nums'>
              {row.item.camera_count.toLocaleString('th-TH')} ตัว
            </span>
          ) : null,
      },
      {
        title: 'ตรวจจับวันนี้',
        key: 'events_today',
        width: 120,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) => {
          if (row.kind !== 'project') return null
          const n = row.item.events_today
          return (
            <span
              className='font-semibold tabular-nums'
              style={{ color: n > 0 ? '#ffffff' : '#ffffff40' }}
            >
              {n.toLocaleString('th-TH')}
            </span>
          )
        },
      },
      {
        title: 'ชั่วโมงล่าสุด',
        key: 'events_hour',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) => {
          if (row.kind !== 'project') return null
          const n = row.item.events_hour
          return n > 0 ? (
            <span className='inline-flex items-center gap-1 text-(--yellow) font-semibold tabular-nums'>
              <span
                className='inline-block w-1.5 h-1.5 rounded-full bg-(--yellow)'
                style={{ boxShadow: '0 0 6px rgba(252,209,22,0.7)' }}
              />
              {n.toLocaleString('th-TH')}
            </span>
          ) : (
            <span className='text-gray-500 tabular-nums'>0</span>
          )
        },
      },
      {
        title: 'ล่าสุด',
        key: 'latest_captured_at',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_, row) =>
          row.kind === 'project'
            ? row.item.latest_captured_at
              ? dayjs(row.item.latest_captured_at).locale('th').fromNow()
              : '-'
            : null,
      },
    ] satisfies ColumnsType<TableRow>).filter((c) => SHOW_PROJECT_NAME || c.title !== 'ชื่อโครงการ'),
    [goToDetail],
  )

  return (
    <Table<TableRow>
      key={tableKey}
      rowKey='id'
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1500 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableLPRData)
