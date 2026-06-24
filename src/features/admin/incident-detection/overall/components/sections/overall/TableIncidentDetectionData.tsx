"use client"
import React, { useMemo, useCallback, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff, TbShieldFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentRow } from '@/features/admin/incident-detection/overall/data/incidentData'
import LicenseModal, { type LicenseModalSolution } from '@/features/admin/incident-detection/components/LicenseModal'

interface Props {
  rows: IncidentRow[]
  loading?: boolean
}

const WarrantyPill: React.FC<{ warranty: IncidentRow['warranty'] }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

const StatusPill: React.FC<{ online: boolean }> = ({ online }) => {
  const color = online ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
      {online ? 'ออนไลน์' : 'ออฟไลน์'}
    </span>
  )
}

const StreamPill: React.FC<{ online: boolean }> = ({ online }) => {
  const color = online ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {online ? 'Connect' : 'Disconnect'}
    </span>
  )
}

/** License action icon — opens the License modal, which fetches the solution's
 *  license keys on demand from /analytic/license/{solution_id}. */
const LicenseIcon: React.FC = () => (
  <TbShieldFilled size={20} style={{ color: '#66AEFF' }} />
)

type TableRow =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'project'; id: string; item: IncidentRow; roadCodeSpan: number }

const TOTAL_COLS = 10

/** Tab 2 — detail view. Columns after จุดติดตั้ง: กล้องวิเคราะห์ · เหตุการณ์ ·
 *  License · สถานะ · Stream (the incident-specific columns). */
const TableIncidentDetectionData: React.FC<Props> = ({ rows, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const [licenseSolution, setLicenseSolution] = useState<LicenseModalSolution | null>(null)

  const openLicense = useCallback((r: IncidentRow) => {
    setLicenseSolution({ id: r.id, name: r.installPoint, roadId: r.roadId })
  }, [])

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
    if (r.projectId) params.set('project_id', r.projectId)
    if (r.roadId) params.set('road_id', r.roadId)
    router.push(`/admin/incident-detection/detail/${r.id}?${params}`)
  }, [router, deptId])

  const columns: ColumnsType<TableRow> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      width: 150,
      align: 'center',
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
                style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
              >
                {row.count} โครงการ
              </span>
            </div>
          )
        }
        return row.item.roadCode
      },
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      align: 'center',
      ellipsis: true,
      onCell: (row) =>
        row.kind === 'bureau'
          ? { colSpan: 0 }
          : { onClick: () => goToDetail(row.item), style: { cursor: 'pointer' } },
      render: (_, row) => (row.kind === 'project' ? row.item.projectName : null),
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 190,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        return (
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            {row.item.contractNo}
            <TbInfoSquareRoundedFilled
              size={18}
              className='text-white cursor-pointer hover:text-(--yellow)'
              title='ดูข้อมูลโครงการ'
              onClick={() =>
                dispatch(
                  setProjectInfoModalOpen({
                    open: true,
                    project_id: row.item.projectId ? Number(row.item.projectId) : null,
                    road_id: row.item.roadId ? Number(row.item.roadId) : null,
                  })
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
      width: 120,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <WarrantyPill warranty={row.item.warranty} /> : null),
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 240,
      align: 'center',
      onCell: (row) =>
        row.kind === 'bureau'
          ? { colSpan: 0 }
          : { onClick: () => goToDetail(row.item), style: { cursor: 'pointer' } },
      render: (_, row) =>
        row.kind === 'project' ? (
          <span className='hover:text-(--yellow) hover:underline'>{row.item.installPoint}</span>
        ) : null,
    },
    {
      title: 'กล้องวิเคราะห์',
      key: 'analysisCameras',
      width: 120,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? <span className='text-white font-semibold'>{row.item.totalCameras}</span> : null,
    },
    {
      title: 'เหตุการณ์',
      key: 'events',
      width: 100,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row.kind !== 'project') return null
        return (
          <span
            className='font-semibold'
            style={{ color: row.item.events > 0 ? '#FCD116' : '#ffffff40' }}
          >
            {row.item.events}
          </span>
        )
      },
    },
    {
      title: 'License',
      key: 'license',
      width: 100,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <button
            type='button'
            onClick={() => openLicense(row.item)}
            className='cursor-pointer hover:opacity-80'
            title='ดูข้อมูล License'
          >
            <LicenseIcon />
          </button>
        ) : null,
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <StatusPill online={row.item.onlineCameras > 0} /> : null),
    },
    {
      title: 'Stream',
      key: 'stream',
      width: 120,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <StreamPill online={row.item.onlineCameras > 0} /> : null),
    },
  ], [goToDetail, openLicense, dispatch])

  return (
    <>
      <Table<TableRow>
        rowKey='id'
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        size='middle'
        scroll={{ x: 1500 }}
        className='bridge-projects-table'
      />
      <LicenseModal
        open={!!licenseSolution}
        solution={licenseSolution}
        onClose={() => setLicenseSolution(null)}
      />
    </>
  )
}

export default React.memo<Props>(TableIncidentDetectionData)
