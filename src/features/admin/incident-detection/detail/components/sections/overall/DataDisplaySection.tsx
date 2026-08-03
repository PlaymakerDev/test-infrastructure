"use client"
import React, { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useDeptId } from '@/hooks/useDeptId'
import {
  useIncidentCameraList,
  useIncidentCameraTotals,
  useIncidentCentralList,
} from '@/hooks/queries/incident-detection'
import type { IncidentCameraListItem } from '@/types/incident-detection/camera-api'
import CameraGridView, { EventCountTag, type InstallGroup, type CameraRow } from './CameraGridView'
import ExportFileModal from '@/components/export/ExportFileModal'

type ConnectStatus = 'connect' | 'disconnect'

type Row =
  | { kind: 'group'; id: string; group: InstallGroup }
  | { kind: 'camera'; id: string; seq: number; camera: CameraRow }

const StatusPill: React.FC<{ status: ConnectStatus }> = ({ status }) => {
  const connected = status === 'connect'
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${connected ? '#66AEFF' : '#E94C4C'}`, color: connected ? '#66AEFF' : '#E94C4C' }}
    >
      {connected ? 'Connect' : 'Disconnect'}
    </span>
  )
}

const WarrantyPill: React.FC<{ warranty: InstallGroup['warranty'] }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

const FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

const TOTAL_COLS = 7

/** Camera row + its install-point label — the export flattens the table's
 *  group-header row (จุดติดตั้ง) into a leading column, like the overall
 *  exports flatten their per-แขวง divider rows. */
type ExportCameraRow = CameraRow & { point: string }

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (ลำดับที่ → ชื่อกล้อง → กม.ที่ → เหตุการณ์ →
// IP Address → Stream/Device Status). `width` = Excel chars, `widthPct` =
// PDF table percent (sums to 100).
const CAMERA_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: ExportCameraRow, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 20, align: 'left', value: (r) => r.point || '-' },
    { header: 'ชื่อกล้อง', width: 40, widthPct: 25, align: 'left', value: (r) => r.name || '-' },
    { header: 'กม.ที่', width: 10, widthPct: 8, value: (r) => r.km || '-' },
    { header: 'เหตุการณ์', width: 10, widthPct: 8, value: (r) => r.events },
    { header: 'IP Address', width: 18, widthPct: 12, value: (r) => r.ip || '-' },
    { header: 'Stream Status', width: 14, widthPct: 11, value: (r) => (r.streamStatus === 'connect' ? 'Connect' : 'Disconnect') },
    { header: 'Device Status', width: 14, widthPct: 11, value: (r) => (r.deviceStatus === 'connect' ? 'Connect' : 'Disconnect') },
  ]

/** Adapter — /cameras/list row → CameraRow. The analytic endpoint doesn't
 *  carry per-camera function flags, so we derive them: every camera here is
 *  Analytic by definition (it's listed by /analytic); add CCTV when an
 *  hls_url is present (the camera can also serve as a normal stream). The
 *  "การทำงาน" column is hidden in this table, but `functions` still feeds the
 *  Live Stream modal's "ประเภทอุปกรณ์" row. */
const toCameraRow = (item: IncidentCameraListItem): CameraRow => {
  const online = item.camera.status?.is_online ?? false
  const events = item.events?.reduce((sum, e) => sum + (e.events_count ?? 0), 0) ?? 0
  // DEVICE_BADGE keys — resolved to label + color by CameraFunctionTag.
  const functions: string[] = ['analytic']
  if (item.camera.hls_url) functions.unshift('cctv')
  return {
    id: item.camera.id,
    name: item.camera.camera_name,
    km: item.camera.sta,
    functions,
    events,
    ip: item.camera.ip_address,
    streamStatus: online ? 'connect' : 'disconnect',
    deviceStatus: online ? 'connect' : 'disconnect',
    hlsUrl: item.camera.hls_url,
  }
}

/** Detail Tab1 bottom — camera table/grid for this solution. */
const DataDisplaySection: React.FC = () => {
  const dispatch = useAppDispatch()
  const deptId = useDeptId()
  const params = useParams()
  const searchParams = useSearchParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id
  const projectIdParam = searchParams.get('project_id')
  const roadIdParam = searchParams.get('road_id')

  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')
  const [exportOpen, setExportOpen] = useState(false)

  // Server-side `limit` is capped at 100 — sending >100 makes BE return only 2
  // rows with no meta_data (verified live 2026-06-23). For solutions with more
  // than 100 cameras, switch to a paginated table. Most analytic solutions are
  // under that bound (dept 50's largest is 42).
  const { data: cameraList, isLoading } = useIncidentCameraList(deptId, {
    solution_id: solutionId,
    page: 1,
    limit: 100,
  })
  const { data: totals } = useIncidentCameraTotals(deptId, { solution_id: solutionId })

  // Resolve project_id + road_id for the group-header ⓘ: prefer URL params,
  // else DERIVE from the central-list row matched by solution id (cctv pattern)
  // so the Project Info modal stays populated when arriving without project_id
  // (e.g. from the dashboard marker popup). Central list is cached from the
  // overall page, so this is free on table navigation.
  const { data: central } = useIncidentCentralList(deptId)
  const matched = useMemo(() => {
    if (!central || !solutionId) return null
    const target = String(solutionId)
    for (const bureau of central)
      for (const sub of bureau.sub_department)
        for (const sol of sub.solutions)
          if (String(sol.solution.id) === target) return sol
    return null
  }, [central, solutionId])
  const projectId = projectIdParam ? Number(projectIdParam) : matched?.project.id
  const roadId = roadIdParam ? Number(roadIdParam) : matched?.road.id

  // Build a single install group from the API rows. Analytic-detail = one
  // solution, so we have exactly one group in the layout.
  const group: InstallGroup | null = useMemo(() => {
    const rows = cameraList?.res_data ?? []
    if (rows.length === 0) return null
    const first = rows[0]
    return {
      id: String(first.solution.id),
      label: first.solution.solution_name,
      warranty: first.solution.is_warranty ? 'in-warranty' : 'expired',
      projectId,
      roadId,
      cameras: rows.map(toCameraRow),
    }
  }, [cameraList?.res_data, projectId, roadId])

  const allCameras = group?.cameras ?? []

  // Stats prefer the backend totals (camera-level, matches the filter chips).
  const stats: FilterStats = useMemo(() => {
    if (totals) {
      return {
        all: totals.camera.total,
        online: totals.camera.online,
        offline: totals.camera.offline,
      }
    }
    return {
      all: allCameras.length,
      online: allCameras.filter((c) => c.streamStatus === 'connect').length,
      offline: allCameras.filter((c) => c.streamStatus === 'disconnect').length,
    }
  }, [totals, allCameras])

  const filteredGroup = useMemo<InstallGroup | null>(() => {
    if (!group) return null
    let cams = group.cameras
    if (activeFilter === 'online') cams = cams.filter((c) => c.streamStatus === 'connect')
    if (activeFilter === 'offline') cams = cams.filter((c) => c.streamStatus === 'disconnect')
    return cams.length === 0 ? null : { ...group, cameras: cams }
  }, [group, activeFilter])

  const data = useMemo<Row[]>(() => {
    if (!filteredGroup) return []
    const out: Row[] = [{ kind: 'group', id: `group-${filteredGroup.id}`, group: filteredGroup }]
    filteredGroup.cameras.forEach((cam, i) => {
      out.push({ kind: 'camera', id: cam.id, seq: i + 1, camera: cam })
    })
    return out
  }, [filteredGroup])

  // Export rows = the CURRENTLY FILTERED cameras (what the table/grid shows),
  // each tagged with its group-header install point.
  const exportRows = useMemo<ExportCameraRow[]>(
    () => (filteredGroup ? filteredGroup.cameras.map((c) => ({ ...c, point: filteredGroup.label })) : []),
    [filteredGroup]
  )

  // Human-readable note of the active filter — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const filterLabel = FILTERS.find((f) => f.key === activeFilter)?.label
    return activeFilter !== 'all' && filterLabel ? `สถานะ ${filterLabel}` : undefined
  }, [activeFilter])

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'ลำดับที่',
      key: 'seq',
      width: 80,
      // Indent first column 28px to match the overall-page list tables
      // (group divider rows keep their span but also indent their label).
      onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      onCell: (row) =>
        row.kind === 'group'
          ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px 10px 28px' } }
          : { style: { paddingInlineStart: 28, paddingLeft: 28 } },
      render: (_: unknown, row: Row) => {
        if (row.kind === 'group') {
          return (
            <div className='flex items-center gap-3'>
              <span className='text-white font-semibold fs-12'>{row.group.label}</span>
              <TbInfoSquareRoundedFilled
                size={18}
                className='cursor-pointer hover:text-(--yellow)'
                style={{ color: '#fff' }}
                title='ดูข้อมูลโครงการ'
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: row.group.projectId ?? null,
                      road_id: row.group.roadId ?? null,
                    })
                  )
                }
              />
              <WarrantyPill warranty={row.group.warranty} />
            </div>
          )
        }
        return <span className='text-white/60'>{row.seq}</span>
      },
    },
    {
      title: 'ชื่อกล้อง',
      key: 'name',
      width: 340,
      ellipsis: true,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white fs-12'>{row.camera.name}</span> : null,
    },
    {
      title: 'กม.ที่',
      key: 'km',
      width: 100,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white/80 fs-12'>{row.camera.km}</span> : null,
    },
    {
      title: 'เหตุการณ์',
      key: 'events',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <EventCountTag count={row.camera.events} /> : null,
    },
    {
      title: 'IP Address',
      key: 'ip',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white/70 fs-12'>{row.camera.ip}</span> : null,
    },
    {
      title: 'Stream Status',
      key: 'streamStatus',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <StatusPill status={row.camera.streamStatus} /> : null,
    },
    {
      title: 'Device Status',
      key: 'deviceStatus',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <StatusPill status={row.camera.deviceStatus} /> : null,
    },
  ], [dispatch])

  return (
    <div className='flex flex-col gap-4'>
      <SearchBar
        filters={FILTERS}
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        defaultViewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={() => setExportOpen(true)}
      />

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED cameras (what the
          table/grid shows), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Incident_Detection_Camera_Report',
            title: 'รายงานกล้องวิเคราะห์ประจำจุดติดตั้ง (Incident Detection Cameras)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Incident_Detection_Camera_Report',
            sheetName: 'Incident Cameras',
            title: 'รายงานกล้องวิเคราะห์ประจำจุดติดตั้ง (Incident Detection Cameras)',
            filterNote: exportFilterNote,
            columns: CAMERA_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      {viewMode === 'TABLE' ? (
        <Table<Row>
          rowKey='id'
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={false}
          size='middle'
          scroll={{ x: 1180 }}
        />
      ) : (
        <CameraGridView groups={filteredGroup ? [filteredGroup] : []} mode='project' />
      )}
    </div>
  )
}

export default React.memo(DataDisplaySection)
