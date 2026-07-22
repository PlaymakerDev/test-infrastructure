"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff, TbLink, TbUnlink } from 'react-icons/tb'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useOverallContext } from '../context'

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

const TableTrafficLighting: React.FC<Props> = ({ projects }) => {
  const router = useRouter()
  const { deptId } = useOverallContext()

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

  const TOTAL_COLS = 8

  const columns: ColumnsType<Row> = useMemo(() => {
    return [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
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
                  style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
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
        width: 180,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? row.project.contractNo : null,
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
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 220,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? row.project.installPoint : null,
      },
      {
        title: 'Phase',
        key: 'phase',
        width: 90,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white'>{row.project.equipment.count ?? '-'}</span>
          ) : null,
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
          const broken = row.project.hasBrokenWire
          if (broken === null || broken === undefined) return <Pill text='-' color='#979797' />
          // has_broken_wire === true ⇒ สายขาด (broken), false ⇒ เชื่อมต่อ (intact).
          return broken
            ? <Pill text='สายขาด' color='#E94C4C' icon={<TbUnlink size={14} />} />
            : <Pill text='เชื่อมต่อ' color='#66AEFF' icon={<TbLink size={14} />} />
        },
      },
    ]
  }, [])

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
      onRow={(row) =>
        row.kind === 'project'
          ? {
              onClick: () => {
                const {
                  id, imei: projectImei, equipment,
                } = row.project
                const type = equipment.type ?? ''
                const imei = resolveLightingImei(id, projectImei)
                router.push(buildLightingDetailUrl({ routeId: id, imei, type, deptId }))
              },
              style: { cursor: 'pointer' },
            }
          : {}
      }
      locale={{ emptyText: 'ไม่พบข้อมูล' }}
    />
  )
}

export default React.memo<Props>(TableTrafficLighting)
