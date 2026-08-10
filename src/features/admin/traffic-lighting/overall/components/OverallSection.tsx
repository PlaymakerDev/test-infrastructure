"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Input, Spin } from 'antd'
import { TbSearch } from 'react-icons/tb'
import { TableTrafficLighting } from '../components'
import LocationTrafficLighting from './sections/overall/LocationTrafficLighting'
import { useOverallContext } from '../context'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import type { TrafficLightingProject } from '../data/trafficLightingProjects'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'

// Same 5 filters/colors as the old static summaryStats badges — now wired to
// actually filter the list (they never did before), matching the shared
// SearchBar pattern every other overall page (crosswalk, cctv, etc.) already uses.
const TRAFFIC_LIGHTING_FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ', colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white', badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]' },
  { key: 'expired', label: 'หมดค้ำ', colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white', badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

// Text-only twins of TableTrafficLighting's pill labels (warranty/connection +
// LINE_STATUS_LABELS/CIRCUIT_STATUS_LABELS) — the export needs the same
// visible text, minus colors/icons.
const EXPORT_WARRANTY_TEXT: Record<TrafficLightingProject['warranty'], string> = {
  'in-warranty': 'ในค้ำ',
  expired: 'หมดค้ำ',
  unknown: '-',
}
const EXPORT_CONNECTION_TEXT: Record<TrafficLightingProject['connection'], string> = {
  online: 'ออนไลน์',
  offline: 'ออฟไลน์',
  unknown: '-',
}
// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen TableTrafficLighting (รหัสสายทาง → ชื่อโครงการ →
// จุดติดตั้ง → เลขที่สัญญา → การค้ำประกัน → Phase → สถานะการเชื่อมต่อ →
// สถานะสาย), plus ลำดับ/หน่วยงาน since the export flattens the table's
// per-สำนัก divider rows (same treatment as CCTV_EXPORT_COLUMNS in
// cctv/overall). `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
// สถานะวงจร was merged into สถานะสาย (has_broken_wire, 2026-07-21) — the
// export mirrors the on-screen สายขาด/เชื่อมต่อ pill texts.
const LIGHTING_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: TrafficLightingProject, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
    { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.roadCode || '-' },
    { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.projectName || '-' },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 15, align: 'left', value: (r) => r.installPoint || '-' },
    // Same fallback chain as the on-screen ContractInfoCell (contract → budget year).
    { header: 'เลขที่สัญญา', width: 20, widthPct: 11, value: (r) => r.contractNo || (r.budgetYear ? `ปีงบประมาณ ${r.budgetYear}` : '-') },
    { header: 'การค้ำประกัน', width: 13, widthPct: 9, value: (r) => EXPORT_WARRANTY_TEXT[r.warranty] },
    // Mirrors the on-screen Phase cell (equipment count, not the phase field).
    { header: 'Phase', width: 8, widthPct: 6, value: (r) => r.equipment.count ?? '-' },
    { header: 'สถานะการเชื่อมต่อ', width: 16, widthPct: 10, value: (r) => EXPORT_CONNECTION_TEXT[r.connection] },
    {
      header: 'สถานะสาย',
      width: 10,
      widthPct: 8,
      value: (r) =>
        r.hasBrokenWire == null ? '-' : r.hasBrokenWire ? 'สายขาด' : 'เชื่อมต่อ',
    },
  ]

const OverallSection: React.FC = () => {
  const router = useRouter()
  const {
    deptId,
    searchQuery,
    setSearchQuery,
    centralListLoaded,
    centralListError,
    retryCentralList,
    summaryStats,
    filteredProjects,
  } = useOverallContext()
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  // With no search, badge counts come from summaryStats (the live totals
  // endpoint, unaffected by the search box) — reshaped into SearchBar's
  // {key: value} lookup. Once a search is active, they re-tally the
  // already-search-filtered projects so the badges track the search
  // (requested 2026-07-24).
  const filterStats: FilterStats = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0
    if (!hasSearch) {
      const byLabel = new Map(summaryStats.map((s) => [s.label, s.value]))
      return {
        all: byLabel.get('ทั้งหมด'),
        online: byLabel.get('ออนไลน์'),
        offline: byLabel.get('ออฟไลน์'),
        'in-warranty': byLabel.get('ในค้ำ'),
        expired: byLabel.get('หมดค้ำ'),
      }
    }
    return {
      all: filteredProjects.length,
      online: filteredProjects.filter((p) => p.connection === 'online').length,
      offline: filteredProjects.filter((p) => p.connection === 'offline').length,
      'in-warranty': filteredProjects.filter((p) => p.warranty === 'in-warranty').length,
      expired: filteredProjects.filter((p) => p.warranty === 'expired').length,
    }
  }, [summaryStats, searchQuery, filteredProjects])

  // filteredProjects (context) is already search-filtered; apply the status
  // filter on top, same as crosswalk's OverallDataDisplaySection.
  const displayedProjects = useMemo(() => {
    switch (activeFilter) {
      case 'online': return filteredProjects.filter((p) => p.connection === 'online')
      case 'offline': return filteredProjects.filter((p) => p.connection === 'offline')
      case 'in-warranty': return filteredProjects.filter((p) => p.warranty === 'in-warranty')
      case 'expired': return filteredProjects.filter((p) => p.warranty === 'expired')
      default: return filteredProjects
    }
  }, [filteredProjects, activeFilter])

  // Export rows in the SAME order the table displays: grouped by สำนัก
  // (bureau) — mirrors TableTrafficLighting's grouping so the printed report
  // reads exactly like the screen. Exports the CURRENTLY FILTERED rows.
  const exportRows = useMemo(() => {
    const groups = new Map<string, TrafficLightingProject[]>()
    for (const p of displayedProjects) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }
    return [...groups.values()].flat()
  }, [displayedProjects])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = TRAFFIC_LIGHTING_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (searchQuery.trim()) parts.push(`ค้นหา "${searchQuery.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, searchQuery])

  // Same navigation as TableTrafficLighting's onRow. URL params make the
  // detail route portable; tab-local context only enriches its header.
  const goToDetail = useCallback((project: TrafficLightingProject) => {
    const type = project.equipment.type ?? ''
    const imei = resolveLightingImei(project.id, project.imei)
    router.push(buildLightingDetailUrl({
      routeId: project.id,
      imei,
      type,
      deptId,
    }))
  }, [router, deptId])

  const cardItems = useMemo<ProjectCardItem[]>(
    () => displayedProjects.map((p) => ({
      key: p.id,
      roadId: p.roadId ?? 0,
      projectId: p.projectId,
      roadCode: p.roadCode,
      projectName: p.projectName,
      installPoint: p.installPoint,
      contractNo: p.contractNo,
      budgetYear: p.budgetYear,
      isWarranty: p.warranty === 'in-warranty',
      bureau: p.bureau,
      // The central endpoint exposes connectivity per installation, not per
      // individual lamp/controller. Keep all three counters in that unit.
      total: 1,
      online: p.connection === 'online' ? 1 : 0,
      offline: p.connection === 'offline' ? 1 : 0,
      onDetail: () => goToDetail(p),
    })),
    [displayedProjects, goToDetail],
  )

  return (
    <>
      {/* Top area — shared 3-column MapFocusGrid layout (left rail | map |
        * info cards), same pattern as traffic-volume LocationTrafficVolume.
        * No top margin: the screen wraps this whole section in `mt-8 pb-8`,
        * exactly like traffic-volume's screen does. */}
      <section>
        <LocationTrafficLighting />
      </section>

      <div className='mt-4'>
        <SearchBar
          filters={TRAFFIC_LIGHTING_FILTERS}
          stats={filterStats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => setExportOpen(true)}
          formSearch={
            // Same input as every other overall menu's search form (see
            // FormSearchCctv) — the previous bespoke 46px/360px styling made
            // this bar visibly taller/narrower than its siblings.
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...'
              className='rounded-lg app-search-input'
              suffix={<TbSearch className='text-(--yellow)' />}
              size='large'
              allowClear
            />
          }
        />
      </div>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Lighting_Overview_Report',
            title: 'รายงานสรุปภาพรวมไฟฟ้าแสงสว่าง (Traffic Lighting Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(LIGHTING_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Lighting_Overview_Report',
            sheetName: 'Traffic Lighting Overview',
            title: 'รายงานสรุปภาพรวมไฟฟ้าแสงสว่าง (Traffic Lighting Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(LIGHTING_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-4'>
        {centralListError ? (
          <Alert
            type='error'
            showIcon
            message='ไม่สามารถโหลดข้อมูล Traffic Lighting ได้'
            action={<Button size='small' onClick={retryCentralList}>ลองใหม่</Button>}
          />
        ) : !centralListLoaded ? (
          <div className='flex min-h-40 items-center justify-center'><Spin /></div>
        ) : viewMode === 'TABLE' ? (
          <TableTrafficLighting projects={displayedProjects} />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='จุดติดตั้งทั้งหมด' />
        )}
      </section>
    </>
  )
}

export default React.memo(OverallSection)
