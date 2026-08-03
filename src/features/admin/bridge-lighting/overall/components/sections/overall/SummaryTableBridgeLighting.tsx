"use client"
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import DetailLinkText from '@/components/table/DetailLinkText'
import { ContractInfoCell } from '@/components/modal'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import type { APIResponseBridgeLightingList, BridgeLightingSolution } from '@/types/bridge-lighting/overall-api'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'

interface Props {
  data?: APIResponseBridgeLightingList
  loading?: boolean
}

type HeaderRow = {
  type: 'header'
  id: string
  label: string
  count: number
}

type DataRow = {
  type: 'data'
  id: number
  roadCodeRowSpan: number
  projectRowSpan: number
  data: BridgeLightingSolution
}

type Row = HeaderRow | DataRow

// Dept header row spans every visible column — one less while ชื่อโครงการ is hidden.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 6 : 5

/** Outlined pill — reused across การค้ำประกัน / สถานะ cells. Same look as the
 *  crosswalk / traffic-signal / vms overall-list tables. */
const Pill: React.FC<{ text: string; color: string; icon?: React.ReactNode }> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

// Groups solutions by top-level department (header row) then computes
// road-code / project rowspans within each department, mirroring
// vms/overall's TableVMSData.buildRows() — the bridge-lighting list API
// returns the same dept → sub_department → solutions shape.
const buildRows = (apiData: APIResponseBridgeLightingList): Row[] => {
  const rows: Row[] = []

  for (const dept of apiData) {
    const allSolutions = (dept.sub_department ?? []).flatMap((sub) => sub.solutions ?? [])

    rows.push({
      type: 'header',
      id: `dept-${dept.department_id}`,
      label: dept.department_short_name,
      count: allSolutions.length,
    })

    let i = 0
    while (i < allSolutions.length) {
      const currentRoadId = allSolutions[i].road.id
      let roadEnd = i + 1
      while (roadEnd < allSolutions.length && allSolutions[roadEnd].road.id === currentRoadId) roadEnd++

      let j = i
      while (j < roadEnd) {
        const currentProjectId = allSolutions[j].project.id
        let projectEnd = j + 1
        while (projectEnd < roadEnd && allSolutions[projectEnd].project.id === currentProjectId) projectEnd++

        for (let k = j; k < projectEnd; k++) {
          rows.push({
            type: 'data',
            id: allSolutions[k].solution.id,
            roadCodeRowSpan: k === i ? roadEnd - i : 0,
            projectRowSpan: k === j ? projectEnd - j : 0,
            data: allSolutions[k],
          })
        }
        j = projectEnd
      }
      i = roadEnd
    }
  }

  return rows
}

const SummaryTableBridgeLighting: React.FC<Props> = ({ data, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const rows = useMemo(() => buildRows(data ?? []), [data])

  // AntD leaves a stale `rowSpan` DOM attribute behind when a row keeps its
  // rowKey but its span changes across a filter toggle — merged cells then
  // overlap and the table visibly breaks. Remount whenever the merged-row
  // structure (ids + spans) changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () =>
      rows
        .map((r) => (r.type === 'data' ? `${r.id}:${r.roadCodeRowSpan}:${r.projectRowSpan}` : r.id))
        .join('|'),
    [rows],
  )

  const goToDetail = useCallback(
    (sol: BridgeLightingSolution) => {
      // dept_id + is_warranty, plus the current page's scope forwarded via
      // scopeQuerySuffix() — same URL pattern as crosswalk/cctv's detail links.
      const params = new URLSearchParams({
        dept_id: deptId,
        project_id: String(sol.project.id),
        is_warranty: String(sol.is_warranty),
      })
      router.push(`/admin/bridge-lighting/detail/${sol.solution.id}?${params}${scopeQuerySuffix()}`)
    },
    [router, deptId],
  )

  const columns: ColumnsType<Row> = useMemo(() => {
    const all: ColumnsType<Row> = [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        className: 'col-road-code',
        width: 180,
        onCell: (row) => {
          if (row.type === 'header') {
            return {
              colSpan: TOTAL_COLS,
              style: { background: '#2a2a2a', padding: '10px 16px' },
            }
          }
          return { rowSpan: row.roadCodeRowSpan }
        },
        render: (_: unknown, row: Row) => {
          if (row.type === 'header') {
            return (
              <div className='flex items-center gap-3'>
                <span className='text-white font-bold'>{row.label}</span>
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
            <DetailLinkText onClick={() => goToDetail(row.data)}>
              {row.data.road.code_name}
            </DetailLinkText>
          )
        },
      },
      {
        title: 'ชื่อโครงการ',
        key: 'projectName',
        className: 'col-project-name',
        ellipsis: true,
        onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.type === 'data' ? (
            <DetailLinkText onClick={() => goToDetail(row.data)}>
              {row.data.project.project_name || '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 280,
        onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.type === 'data' ? (
            <DetailLinkText onClick={() => goToDetail(row.data)}>
              {row.data.solution.solution_name}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 200,
        onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.type !== 'data') return null
          return (
            <ContractInfoCell
              contractNo={row.data.project.contract_no}
              budgetYear={row.data.project.budget_year}
              projectId={row.data.project.id}
              roadId={row.data.road.id}
            />
          )
        },
      },
      {
        title: 'การค้ำประกัน',
        key: 'warranty',
        width: 140,
        onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.type !== 'data') return null
          return row.data.is_warranty ? (
            <Pill text='ในค้ำ' color='#05F2DB' />
          ) : (
            <Pill text='หมดค้ำ' color='#979797' />
          )
        },
      },
      {
        title: 'สถานะ',
        key: 'status',
        width: 140,
        onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.type !== 'data') return null
          return row.data.is_online ? (
            <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi size={14} />} />
          ) : (
            <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff size={14} />} />
          )
        },
      },
    ]
    // ชื่อโครงการ hidden app-wide while SHOW_PROJECT_NAME is off.
    return SHOW_PROJECT_NAME ? all : all.filter((col) => col.key !== 'projectName')
  }, [goToDetail])

  return (
    <Table<Row>
      key={tableKey}
      rowKey={(row) => String(row.id)}
      columns={columns}
      dataSource={rows}
      pagination={false}
      size='middle'
      loading={loading}
      scroll={{ x: 1200 }}
      // Shared table skin — yellow row dividers + dark pagination styling
      // defined in `src/styles/antd.css` under `.bridge-projects-table`.
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(SummaryTableBridgeLighting)
