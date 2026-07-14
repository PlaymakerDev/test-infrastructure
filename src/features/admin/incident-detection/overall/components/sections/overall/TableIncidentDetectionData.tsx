"use client"
import React, { useMemo, useCallback, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import { TbWifi, TbWifiOff, TbShieldCheckFilled } from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentRow } from '@/features/admin/incident-detection/overall/data/incidentData'
import LicenseModal, { type LicenseModalSolution } from '@/features/admin/incident-detection/components/LicenseModal'
import { getIncidentLicenseAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from '@/hooks/queries/incident-detection/queryKeys'

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
 *  license keys on demand from /analytic/license/{solution_id}. Same glyph +
 *  warranty-colored style as traffic-volume overall (yellow active / gray not). */
const LicenseIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <TbShieldCheckFilled size={20} style={{ color: active ? '#FCD116' : '#979797' }} />
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
  const [licenseSolution, setLicenseSolution] = useState<LicenseModalSolution | null>(null)

  const openLicense = useCallback((r: IncidentRow) => {
    setLicenseSolution({ id: r.id, name: r.installPoint, roadId: r.roadId })
  }, [])

  // Fetch each solution's license list so the column icon reflects ACTUAL
  // license presence (not warranty). Counts are small (≤~50 solutions/dept)
  // and cached forever. Icon is YELLOW by default; turns GRAY only once a
  // query resolves with an empty license list.
  const solutionIds = useMemo(() => rows.map((r) => r.id), [rows])
  const licenseQueries = useQueries({
    queries: solutionIds.map((id) => ({
      queryKey: incidentKeys.license(id),
      queryFn: () => getIncidentLicenseAPI(id).then((r) => r.data),
      enabled: !!id,
      staleTime: Infinity,
    })),
  })
  const hasLicenseById = useMemo(() => {
    const m = new Map<string, boolean>()
    solutionIds.forEach((id, i) => {
      const d = licenseQueries[i]?.data
      if (d) m.set(id, (d.license?.length ?? 0) > 0)
    })
    return m
  }, [solutionIds, licenseQueries])

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
    router.push(`/admin/incident-detection/detail/${r.id}?${params}`)
  }, [router, deptId])

  const columns: ColumnsType<TableRow> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
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
                className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
                style={{ border: '1px solid #fff', color: '#fff' }}
              >
                {row.count} โครงการ
              </span>
            </div>
          )
        }
        return (
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.roadCode}
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
      render: (_, row) =>
        row.kind === 'project' ? (
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.projectName}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 240,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <DetailLinkText onClick={() => goToDetail(row.item)}>
            {row.item.installPoint}
          </DetailLinkText>
        ) : null,
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 190,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <ContractInfoCell
            contractNo={row.item.contractNo}
            budgetYear={row.item.budgetYear}
            projectId={row.item.projectId}
            roadId={row.item.roadId}
          />
        ) : null,
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <WarrantyPill warranty={row.item.warranty} /> : null),
    },
    {
      title: 'กล้องวิเคราะห์',
      key: 'analysisCameras',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? <span className='text-white font-semibold'>{row.item.totalCameras}</span> : null,
    },
    {
      title: 'เหตุการณ์',
      key: 'events',
      width: 100,
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
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) =>
        row.kind === 'project' ? (
          <button
            type='button'
            onClick={() => openLicense(row.item)}
            className='cursor-pointer hover:opacity-80'
            title='ดูข้อมูล License'
          >
            <LicenseIcon active={hasLicenseById.get(row.item.id) !== false} />
          </button>
        ) : null,
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <StatusPill online={row.item.onlineCameras > 0} /> : null),
    },
    {
      title: 'Stream',
      key: 'stream',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_, row) => (row.kind === 'project' ? <StreamPill online={row.item.onlineCameras > 0} /> : null),
    },
  ], [goToDetail, openLicense, hasLicenseById])

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
