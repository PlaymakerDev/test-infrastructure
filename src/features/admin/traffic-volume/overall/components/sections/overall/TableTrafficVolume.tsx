"use client"
import React, { useMemo, useCallback, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import {
  TbShieldCheckFilled,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'
import LicenseModal, { type LicenseModalSolution } from '@/features/admin/traffic-volume/components/LicenseModal'
import { getTrafficVolumeLicenseAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import {
  groupByBureau,
  type BureauGroupedRow,
} from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import type { TrafficVolumeProject } from '@/features/admin/traffic-volume/overall/data/trafficVolumes'

interface Props {
  /** Filtered + searched traffic-volume projects */
  projects: TrafficVolumeProject[]
  loading?: boolean
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

type Row = BureauGroupedRow<TrafficVolumeProject>

const TableTrafficVolume: React.FC<Props> = ({ projects, loading }) => {
  const router = useRouter()
  const deptId = useDeptId()
  const [licenseSolution, setLicenseSolution] = useState<LicenseModalSolution | null>(null)
  // Pass project_id + road_id (+ dept_id) so the detail page can open the
  // central Project Info modal without re-fetching.
  const goToDetail = useCallback((project: TrafficVolumeProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-volume/detail/${project.id}?${params}`)
  }, [router, deptId])
  // Open the License modal — fetches the solution's camera license keys on
  // demand from /counting/license/{solution_id} (mirrors incident-detection).
  const openLicense = useCallback((project: TrafficVolumeProject) => {
    setLicenseSolution({ id: project.id, name: project.installPoint, roadId: project.roadId ?? '' })
  }, [])

  // Fetch each solution's license list so the column icon reflects ACTUAL
  // license presence (not warranty). Counts are small (≤~50 solutions/dept)
  // and cached forever. Icon is YELLOW by default; turns GRAY only once a
  // query resolves with an empty license list.
  const solutionIds = useMemo(() => projects.map((p) => p.id), [projects])
  const licenseQueries = useQueries({
    queries: solutionIds.map((id) => ({
      queryKey: trafficVolumeKeys.license(id),
      queryFn: () => getTrafficVolumeLicenseAPI(id).then((r) => r.data),
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

  const data = useMemo<Row[]>(() => groupByBureau(projects), [projects])

  const TOTAL_COLS = 10

  const columns: ColumnsType<Row> = useMemo(() => {
    return [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        width: 140,
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
        ellipsis: true,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <DetailLinkText onClick={() => goToDetail(row.project)}>
              {row.project.projectName ?? '-'}
            </DetailLinkText>
          ) : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 260,
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
        title: 'กล้องนับรถ',
        key: 'totalDevices',
        width: 110,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'project' ? (
            <span className='text-white font-semibold'>
              {row.project.totalDevices}
            </span>
          ) : null,
      },
      {
        title: 'ปริมาณจราจร',
        key: 'trafficVolume',
        width: 130,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const v = row.project.trafficCount
          return v == null ? (
            <span className='text-gray-500'>-</span>
          ) : (
            <span className='text-white'>{v.toLocaleString()} คัน</span>
          )
        },
      },
      {
        title: 'License',
        key: 'license',
        width: 90,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        // Mirrors `is_warranty` visually — yellow when active, gray when not.
        render: (_: unknown, row: Row) => {
          if (row.kind !== 'project') return null
          const active = hasLicenseById.get(row.project.id) !== false
          return (
            <button
              type='button'
              onClick={() => openLicense(row.project)}
              className='cursor-pointer hover:opacity-80'
              title='ดูข้อมูล License'
            >
              <TbShieldCheckFilled
                size={20}
                className='inline-block'
                style={{ color: active ? '#FCD116' : '#979797' }}
              />
            </button>
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
            <Pill text='Connect' color='#66AEFF' icon={<TbWifi size={14} />} />
          ) : (
            <Pill text='Disconnect' color='#E94C4C' icon={<TbWifiOff size={14} />} />
          )
        },
      },
    ]
  }, [goToDetail, openLicense, hasLicenseById])

  return (
    <>
      <Table<Row>
        rowKey='id'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='middle'
        loading={loading}
        scroll={{ x: 1500 }}
        className='bridge-projects-table'
        rowClassName={(row) => (row.kind === 'project' ? 'project-row' : '')}
      />
      <LicenseModal
        open={!!licenseSolution}
        solution={licenseSolution}
        onClose={() => setLicenseSolution(null)}
      />
    </>
  )
}

export default React.memo<Props>(TableTrafficVolume)
