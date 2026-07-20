"use client"
import React, { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import CameraGridView, { type InstallGroup, type CameraRow } from './sections/CameraGridView'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

// ── Types (local) ─────────────────────────────────────────────────────────────

type ConnectStatus = 'connect' | 'disconnect'
type WarrantyStatus = 'in-warranty' | 'expired'

type Row =
  | { kind: 'group'; id: string; group: InstallGroup }
  | { kind: 'camera'; id: string; seq: number; camera: CameraRow }

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: ConnectStatus }> = ({ status }) => {
  const connected = status === 'connect'
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{
        border: `1px solid ${connected ? '#66AEFF' : '#E94C4C'}`,
        color: connected ? '#66AEFF' : '#E94C4C',
      }}
    >
      {connected ? 'Connect' : 'Disconnect'}
    </span>
  )
}

const WarrantyPill: React.FC<{ warranty: WarrantyStatus }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

// ── Filter config ─────────────────────────────────────────────────────────────

const CAMERA_FILTERS: FilterConfig[] = [
  { key: 'all',     label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online',  label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white',   badgeIdleClass: 'bg-red-500/20 text-red-400'    },
]

const TOTAL_COLS = 7

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  groups: InstallGroup[]
  loading?: boolean
}

const CameraInstallTable: React.FC<Props> = ({ groups, loading }) => {
  const dispatch = useAppDispatch()
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode]         = useState<ViewMode>('GRID')

  const allCameras = useMemo(() => groups.flatMap((g) => g.cameras), [groups])

  const stats: FilterStats = useMemo(() => ({
    all:     allCameras.length,
    online:  allCameras.filter((c) => c.streamStatus === 'connect').length,
    offline: allCameras.filter((c) => c.streamStatus === 'disconnect').length,
  }), [allCameras])

  const filteredGroups = useMemo(() =>
    groups
      .map((group) => {
        let cams = group.cameras
        if (activeFilter === 'online')  cams = cams.filter((c) => c.streamStatus === 'connect')
        if (activeFilter === 'offline') cams = cams.filter((c) => c.streamStatus === 'disconnect')
        return { ...group, cameras: cams }
      })
      .filter((g) => g.cameras.length > 0),
  [groups, activeFilter])

  const data = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const group of filteredGroups) {
      out.push({ kind: 'group', id: `group-${group.id}`, group })
      group.cameras.forEach((cam, i) => {
        out.push({ kind: 'camera', id: cam.id, seq: i + 1, camera: cam })
      })
    }
    return out
  }, [filteredGroups])

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
              <span className='text-white font-semibold text-sm'>{row.group.label}</span>
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
        row.kind === 'camera' ? <span className='text-white text-sm'>{row.camera.name}</span> : null,
    },
    {
      title: 'กม.ที่',
      key: 'km',
      width: 100,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white/80 text-sm'>{row.camera.km}</span> : null,
    },
    {
      title: 'การทำงาน',
      key: 'functions',
      width: 180,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera'
          ? <div className='flex flex-wrap gap-1'>{row.camera.functions.map((fn) => <CameraFunctionTag key={fn} tag={fn} />)}</div>
          : null,
    },
    {
      title: 'IP Address',
      key: 'ip',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white/70 text-sm'>{row.camera.ip}</span> : null,
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
        filters={CAMERA_FILTERS}
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        defaultViewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={() => alert('TODO: นำออกเอกสาร')}
      />

      {viewMode === 'TABLE' ? (
        <Table<Row>
          rowKey='id'
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          size='middle'
          scroll={{ x: 1100 }}
        />
      ) : (
        <CameraGridView groups={filteredGroups} mode='project' />
      )}

    </div>
  )
}

export default React.memo<Props>(CameraInstallTable)
