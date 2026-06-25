"use client"
import React, { useMemo, useState } from 'react'
import { Segmented, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import SearchBar, {
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import CameraGridView, { type InstallGroup, type CameraRow } from './CameraGridView'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseKm = (km: string): number => {
  const [main, sub] = km.split('+')
  return (parseInt(main ?? '0', 10) * 1000) + parseInt(sub ?? '0', 10)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ConnectStatus = 'connect' | 'disconnect'
type WarrantyStatus = 'in-warranty' | 'expired'

type Row =
  | { kind: 'group'; id: string; group: InstallGroup }
  | { kind: 'camera'; id: string; seq: number; camera: CameraRow }

// ── Sub-components (table-specific) ──────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  groups: InstallGroup[]
}

const VIEW_TABS = ['โครงการ', 'กม.'] as const
type ViewTab = typeof VIEW_TABS[number]

const TOTAL_COLS = 7

const CameraDetailTableCctv: React.FC<Props> = ({ groups }) => {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<ViewTab>('โครงการ')
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  const allCameras = useMemo(() => groups.flatMap((g) => g.cameras), [groups])

  const stats: FilterStats = useMemo(() => ({
    all:        allCameras.length,
    online:     allCameras.filter((c) => c.streamStatus === 'connect').length,
    offline:    allCameras.filter((c) => c.streamStatus === 'disconnect').length,
    inWarranty: groups.filter((g) => g.warranty === 'in-warranty').flatMap((g) => g.cameras).length,
    expired:    groups.filter((g) => g.warranty === 'expired').flatMap((g) => g.cameras).length,
  }), [groups, allCameras])

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        let cams = group.cameras
        if (activeFilter === 'online')      cams = cams.filter((c) => c.streamStatus === 'connect')
        if (activeFilter === 'offline')     cams = cams.filter((c) => c.streamStatus === 'disconnect')
        if (activeFilter === 'in-warranty') cams = group.warranty === 'in-warranty' ? cams : []
        if (activeFilter === 'expired')     cams = group.warranty === 'expired' ? cams : []
        return { ...group, cameras: cams }
      })
      .filter((g) => g.cameras.length > 0)
  }, [groups, activeFilter])

  const data = useMemo<Row[]>(() => {
    if (activeTab === 'กม.') {
      return filteredGroups
        .flatMap((g) => g.cameras)
        .sort((a, b) => parseKm(a.km) - parseKm(b.km))
        .map((cam, i) => ({ kind: 'camera' as const, id: cam.id, seq: i + 1, camera: cam }))
    }
    const out: Row[] = []
    for (const group of filteredGroups) {
      out.push({ kind: 'group', id: `group-${group.id}`, group })
      group.cameras.forEach((cam, i) => {
        out.push({ kind: 'camera', id: cam.id, seq: i + 1, camera: cam })
      })
    }
    return out
  }, [filteredGroups, activeTab])

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'ลำดับที่',
      key: 'seq',
      width: 80,
      align: 'center' as const,
      onCell: (row) =>
        row.kind === 'group'
          ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
          : {},
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
      align: 'center' as const,
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
          ? (
            <div className='flex flex-wrap gap-1'>
              {row.camera.functions.map((fn) => <CameraFunctionTag key={fn} tag={fn} />)}
            </div>
          )
          : null,
    },
    {
      title: 'IP Address',
      key: 'ip',
      width: 140,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <span className='text-white/70 text-sm font-mono'>{row.camera.ip}</span> : null,
    },
    {
      title: 'Stream Status',
      key: 'streamStatus',
      width: 140,
      align: 'center' as const,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <StatusPill status={row.camera.streamStatus} /> : null,
    },
    {
      title: 'Device Status',
      key: 'deviceStatus',
      width: 140,
      align: 'center' as const,
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <StatusPill status={row.camera.deviceStatus} /> : null,
    },
  ], [dispatch])

  return (
    <div className='flex flex-col gap-4'>

      {/* Title */}
      <h2 className='text-base sm:text-lg font-bold' style={{ color: '#FCD116' }}>ตารางรายการกล้อง CCTV</h2>

      {/* Tabs + SearchBar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>

        <div className='shrink-0'>
          <Segmented
            value={activeTab}
            onChange={(v) => setActiveTab(v as ViewTab)}
            options={VIEW_TABS.map((tab) => ({ value: tab, label: tab }))}
            size='large'
          />
        </div>

        <div className='min-w-0 flex-1'>
          <SearchBar
            filters={[]}
            stats={stats}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            defaultViewMode={viewMode}
            onViewModeChange={setViewMode}
            onExport={() => alert('TODO: นำออกเอกสาร')}
          />
        </div>

      </div>

      {/* Table / Grid */}
      {viewMode === 'TABLE' ? (
        <Table<Row>
          rowKey='id'
          columns={columns}
          dataSource={data}
          pagination={false}
          size='middle'
          scroll={{ x: 1100 }}
        />
      ) : (
        <CameraGridView groups={filteredGroups} mode={activeTab === 'กม.' ? 'km' : 'project'} />
      )}

    </div>
  )
}

export default React.memo(CameraDetailTableCctv)
