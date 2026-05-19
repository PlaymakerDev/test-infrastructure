"use client"
import React, { useMemo, useState } from 'react'
import { Segmented, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import CameraGridView, { type InstallGroup, type CameraRow } from './CameraGridView'

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseKm = (km: string): number => {
  const [main, sub] = km.split('+')
  return (parseInt(main ?? '0', 10) * 1000) + parseInt(sub ?? '0', 10)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FunctionTag = 'CCTV' | 'Incident' | 'Volume'
type ConnectStatus = 'connect' | 'disconnect'
type WarrantyStatus = 'in-warranty' | 'expired'

type Row =
  | { kind: 'group'; id: string; group: InstallGroup }
  | { kind: 'camera'; id: string; seq: number; camera: CameraRow }

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_GROUPS: InstallGroup[] = [
  {
    id: 'g1',
    label: 'จุดติดตั้ง 1 : ฉซ.3001 กม.16+300 - 16+650',
    warranty: 'in-warranty',
    cameras: [
      { id: 'c1-1', name: '67MST-CCO3001-FAI001-จุดที่1-กม.16+650-มุ่งหน้าอะเชิงเกรา',  km: '16+650', functions: ['CCTV', 'Incident'], ip: '10.101.27.1', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c1-2', name: '67MST-CCO3001-FAI002-จุดที่1-กม.16+650-มุ่งหน้าแยกไฟแดง',   km: '16+650', functions: ['CCTV', 'Incident'], ip: '10.101.27.2', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
      { id: 'c1-3', name: '67MST-CCO3001-FAI003-จุดที่1-กม.16+650-มุ่งหน้าอะเชิงเกรา',  km: '16+650', functions: ['CCTV', 'Volume'],   ip: '10.101.27.3', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c1-4', name: '67MST-CCO3001-FAI004-จุดที่2-กม.16+300-มุ่งหน้าบางนา-ตราด', km: '16+300', functions: ['CCTV', 'Incident'], ip: '10.101.27.4', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c1-5', name: '67MST-CCO3001-FAI005-จุดที่2-กม.16+300-มุ่งหน้าแยกไฟแดง',   km: '16+300', functions: ['CCTV', 'Volume'],   ip: '10.101.27.5', streamStatus: 'connect',    deviceStatus: 'connect' },
    ],
  },
  {
    id: 'g2',
    label: 'จุดติดตั้ง 2 : ฉซ.3001 แยกจราจรเกาะไร่ กม.7+900',
    warranty: 'expired',
    cameras: [
      { id: 'c2-1', name: '68MST-CCO3001-FAI001-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าลาดกระบัง', km: '7+900', functions: ['CCTV'], ip: '10.131.22.1', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
      { id: 'c2-2', name: '68MST-CCO3001-FAI002-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าแยก',   km: '7+900', functions: ['CCTV'], ip: '10.131.22.2', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
      { id: 'c2-3', name: '68MST-CCO3001-FAI003-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าบางนา-ตราด', km: '7+900', functions: ['CCTV'], ip: '10.131.22.3', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
      { id: 'c2-4', name: '68MST-CCO3001-FAI004-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าแยก',   km: '7+900', functions: ['CCTV'], ip: '10.131.22.4', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
    ],
  },
  {
    id: 'g3',
    label: 'จุดติดตั้ง 3 : ฉซ.3001 กม.3+000 - 20+000',
    warranty: 'expired',
    cameras: [
      { id: 'c3-1', name: '68FTD-CCO3001-FAI001-จุดที่1-กม.3+000-มุ่งหน้าฟาร์มไม้ไก่', km: '3+000', functions: ['CCTV', 'Incident'], ip: '10.131.1.1', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c3-2', name: '68FTD-CCO3001-FAI002-จุดที่1-กม.3+000-มุ่งหน้ากา.314',       km: '3+000', functions: ['CCTV', 'Incident'], ip: '10.131.1.2', streamStatus: 'disconnect', deviceStatus: 'disconnect' },
      { id: 'c3-3', name: '68FTD-CCO3001-FAI003-จุดที่2-กม.3+150-มุ่งหน้าฟาร์มไม้ไก่', km: '3+150', functions: ['CCTV', 'Volume'],   ip: '10.131.1.3', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c3-4', name: '68FTD-CCO3001-FAI004-จุดที่2-กม.3+150-มุ่งหน้ากา.314',       km: '3+150', functions: ['CCTV'],             ip: '10.131.1.4', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c3-5', name: '68FTD-CCO3001-FAI005-จุดที่2-กม.3+200-มุ่งหน้าฟาร์มไม้ไก่', km: '3+200', functions: ['CCTV', 'Volume'],   ip: '10.131.1.5', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c3-6', name: '68FTD-CCO3001-FAI007-จุดที่4-กม.3+400-มุ่งหน้าฟาร์มไม้ไก่', km: '3+400', functions: ['CCTV'],             ip: '10.131.1.6', streamStatus: 'connect',    deviceStatus: 'connect' },
      { id: 'c3-7', name: '68FTD-CCO3001-FAI009-จุดที่5-กม.6+000-มุ่งที่ทำการกำนันตำบลสะเทรา', km: '6+000', functions: ['CCTV'], ip: '10.131.1.7', streamStatus: 'connect',    deviceStatus: 'connect' },
    ],
  },
]

// ── Sub-components (table-specific) ──────────────────────────────────────────

const FunctionTag: React.FC<{ tag: FunctionTag }> = ({ tag }) => {
  const cfg: Record<FunctionTag, { bg: string; border: string; color: string }> = {
    CCTV:     { bg: 'transparent', border: '#f97316', color: '#f97316' },
    Incident: { bg: '#22c55e',     border: '#22c55e', color: '#fff' },
    Volume:   { bg: 'transparent', border: '#a3e635', color: '#a3e635' },
  }
  const { bg, border, color } = cfg[tag]
  return (
    <span
      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap'
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {tag}
    </span>
  )
}

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

// ── FilterConfig ──────────────────────────────────────────────────────────────

const CAMERA_FILTERS: FilterConfig[] = [
  { key: 'all',         label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white',  badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online',      label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white',  badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline',     label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white',     badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ',   colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white',  badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]', statKey: 'inWarranty' },
  { key: 'expired',     label: 'หมดค้ำ',  colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white',  badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  groups?: InstallGroup[]
}

const VIEW_TABS = ['โครงการ', 'กม.'] as const
type ViewTab = typeof VIEW_TABS[number]

const TOTAL_COLS = 7

const CameraDetailTableCctv: React.FC<Props> = ({ groups = MOCK_GROUPS }) => {
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
              <TbInfoSquareRoundedFilled size={18} className='cursor-pointer' style={{ color: '#fff' }} title='ดูรายละเอียด' />
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
              {row.camera.functions.map((fn) => <FunctionTag key={fn} tag={fn} />)}
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
  ], [])

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
