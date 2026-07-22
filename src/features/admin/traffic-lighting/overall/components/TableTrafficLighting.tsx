"use client"
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff, TbLink, TbUnlink } from 'react-icons/tb'
import ContractInfoCell from '@/components/modal/ContractInfoCell'
import DetailLinkText from '@/components/table/DetailLinkText'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useOverallContext } from '../context'
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'

interface Props {
  projects: TrafficLightingProject[]
}

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

type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | {
      kind: 'project'
      id: string
      project: TrafficLightingProject
      roadCodeSpan: number
    }

// Bureau header row spans every visible column — one less while ชื่อโครงการ
// is hidden.
const TOTAL_COLS = SHOW_PROJECT_NAME ? 8 : 7


const TableTrafficLighting: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const { deptId } = useOverallContext()

  // Standard navigation cells (yellow DetailLinkText on รหัสสายทาง/จุดติดตั้ง,
  // same as every other overall table) — replaces the old whole-row onClick,
  // which also swallowed the ⓘ ContractInfoCell click and navigated away.
  const goToDetail = useCallback((project: TrafficLightingProject) => {
    const { id, imei: projectImei, equipment } = project
    const type = equipment.type ?? ''
    const imei = resolveLightingImei(id, projectImei)
    router.push(buildLightingDetailUrl({ routeId: id, imei, type, deptId }))
  }, [router, deptId])

  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, TrafficLightingProject[]>()
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

  const columns: ColumnsType<Row> = useMemo(() => {
    const all: ColumnsType<Row> = [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        // Shared 28px first-column indent (antd.css `col-road-code`) — same
        // as every other overall table; was the one table missing it.
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
                  // White pill — same as every other overall table's bureau
                  // divider (see CamerasTableCctv/TableTrafficSignal).
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
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? row.project.projectName : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 220,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.installPoint}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 180,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        // Shared เลขที่สัญญา cell (same as every other overall table):
        // contract number + ⓘ Project-Info modal, falling back to the
        // budget year when the project has no contract on record.
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
          if (row.project.warranty === 'unknown') return <Pill text='-' color='#979797' />
          return row.project.warranty === 'in-warranty'
            ? <Pill text='ในค้ำ' color='#05F2DB' />
            : <Pill text='หมดค้ำ' color='#979797' />
        },
      },
      {
        title: 'Phase',
        key: 'phase',
        width: 90,
        align: 'left',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project'
            ? (row.project.equipment.type === 'lamp'
                ? null
                : <span className='text-white'>{row.project.equipment.count ?? '-'}</span>)
            : null,
      },
      {
        title: 'สถานะการเชื่อมต่อ',
        key: 'connection',
        width: 150,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          if (row.project.connection === 'unknown') return <Pill text='-' color='#979797' />
          return row.project.connection === 'online'
            ? <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi size={14} />} />
            : <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff size={14} />} />
        },
      },
      {
        title: 'สถานะสาย',
        key: 'lineStatus',
        width: 130,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          // Lamp rows are represented by a plain aggregate text, not a
          // line-status badge. Controller/phase rows retain their badge.
          if (row.project.equipment.type === 'lamp') {
            const total = row.project.equipment.count
            const online = row.project.connection === 'online' ? total : 0
            return (
              <span className='text-white whitespace-nowrap'>
                จำนวนโคมไฟ{' '}
                {total !== null ? (
                  <>
                    <span className='text-(--red)'>{online}</span>
                    <span className='text-(--yellow)'>/{total}</span>
                  </>
                ) : (
                  '-'
                )}
              </span>
            )
          }
          const broken = row.project.hasBrokenWire
          if (broken === null || broken === undefined) return <Pill text='-' color='#979797' />
          return broken
            ? <Pill text='สายขาด' color='#E94C4C' icon={<TbUnlink size={14} />} />
            : <Pill text='เชื่อมต่อ' color='#66AEFF' icon={<TbLink size={14} />} />
        },
      },
    ]
    // ชื่อโครงการ hidden app-wide while SHOW_PROJECT_NAME is off.
    return SHOW_PROJECT_NAME ? all : all.filter((col) => col.key !== 'projectName')
  }, [goToDetail])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      // Horizontal scroll inside the table on narrow viewports.
      scroll={{ x: 1400 }}
      className='bridge-projects-table'
      rowClassName={(row) => (row.kind === 'project' ? 'project-row' : '')}
      locale={{ emptyText: 'ไม่พบข้อมูล' }}
    />
  )
}

export default React.memo<Props>(TableTrafficLighting)
