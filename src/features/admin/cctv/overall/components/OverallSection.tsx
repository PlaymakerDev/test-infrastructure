"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton } from 'antd'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import MapSectionCctv from './sections/overall/MapSectionCctv'
import StatsSectionCctv from './sections/overall/StatsSectionCctv'
import CameraListCctv from './sections/overall/CameraListCctv'
import CamerasTableCctv from './sections/overall/CamerasTableCctv'
import CardGridCctv from './sections/overall/CardGridCctv'
import FormSearchCctv from './sections/overall/FormSearchCctv'
import {
  useCctvOverviewCentralList,
  useCctvOverviewCentralTotals,
  useCctvRandomOnline,
} from '@/hooks/queries/cctv'
import type { CCTVOverviewRow } from '@/types/cctv/overview-api'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import { useScopeAll } from '@/hooks/useScopeAll'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'

interface Props {
  deptId?: string | null
  roadId?: string | null
}

const CCTV_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online',
    label: 'ออนไลน์',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline',
    label: 'ออฟไลน์',
    colorPrimary: '#E94C4C',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
  {
    key: 'in-warranty',
    label: 'ในค้ำ',
    statKey: 'inWarranty',
    colorPrimary: '#05F2DB',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#016f64] text-white',
    badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]',
  },
  {
    key: 'expired',
    label: 'หมดค้ำ',
    colorPrimary: '#979797',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → ชื่อโครงการ → จุดติดตั้ง →
// เลขที่สัญญา → การค้ำประกัน → counts), plus ลำดับ/หน่วยงาน since the export
// flattens the table's per-แขวง divider rows. `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const CCTV_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CCTVOverviewRow, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
    { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.road?.code_name || '-' },
    { header: 'ชื่อโครงการ', width: 34, widthPct: 18, align: 'left', value: (r) => r.project?.project_name || '-' },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 18, align: 'left', value: (r) => r.solution?.solution_name || '-' },
    // Same fallback chain as the on-screen ContractInfoCell (contract → budget year).
    { header: 'เลขที่สัญญา', width: 20, widthPct: 12, value: (r) => r.project?.contract_no || (r.project?.budget_year ? `ปีงบประมาณ ${r.project.budget_year}` : '-') },
    { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.is_warranty ? 'อยู่ในค้ำ' : 'หมดค้ำ') },
    { header: 'กล้องทั้งหมด', width: 12, widthPct: 8, value: (r) => r.camera?.total ?? '-' },
    { header: 'ออนไลน์', width: 9, widthPct: 6, value: (r) => r.camera?.online ?? '-' },
    { header: 'ออฟไลน์', width: 9, widthPct: 6, value: (r) => r.camera?.offline ?? '-' },
  ]

const OverallSection: React.FC<Props> = ({ deptId, roadId }) => {
  const router = useRouter()
  const scopeAll = useScopeAll()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = CCTV_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  // Bureau-aware list — nested bureau → sub-department (แขวง) → solutions.
  // Flatten into rows tagged with their แขวง so the table can group by it
  // (like traffic-signal). No pagination — returns the whole department.
  const { data: centralData, isLoading: listLoading } = useCctvOverviewCentralList(deptId, roadId ? { road_id: Number(roadId) } : {})
  const { data: totals } = useCctvOverviewCentralTotals(deptId, roadId ? { road_id: Number(roadId) } : {})
  const { data: randomOnlineRes } = useCctvRandomOnline(deptId, roadId ? { limit: 3, road_id: Number(roadId) } : { limit: 3 })
  const randomOnline = randomOnlineRes?.data ?? []

  const allItems = useMemo<CCTVOverviewRow[]>(() => {
    const rows: CCTVOverviewRow[] = []
    for (const bureau of centralData ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          rows.push({ ...sol, bureau: sub.department_short_name })
        }
      }
    }
    return rows
  }, [centralData])

  // Rows matching the search box ONLY (independent of the active status
  // filter) — the base set for both the badge counts and the table.
  const searchFiltered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allItems
    return allItems.filter((item) => {
      const haystack = `${item.bureau} ${item.road.code_name} ${item.solution.solution_name} ${item.project.contract_no}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [allItems, search])

  // Filter badge counts mirror the right-rail stat cards (API camera counts),
  // NOT the installation-point row counts: ทั้งหมด/ออนไลน์/ออฟไลน์ = camera
  // tallies, ในค้ำ/หมดค้ำ = warranty จุด. With no search we read the API
  // `totals` (exact match to the cards); once a search is active we re-tally
  // the matching rows so the badges track the search (requested 2026-07-24).
  const stats: FilterStats = useMemo(() => {
    const hasSearch = search.trim().length > 0
    if (!hasSearch) {
      return {
        all: totals?.camera.total ?? 0,
        online: totals?.camera.online ?? 0,
        offline: totals?.camera.offline ?? 0,
        inWarranty: totals?.warranty.active ?? 0,
        expired: totals?.warranty.expired ?? 0,
      }
    }
    return searchFiltered.reduce(
      (acc, i) => {
        acc.all += i.camera.total
        acc.online += i.camera.online
        acc.offline += i.camera.offline
        if (i.is_warranty) acc.inWarranty += 1
        else acc.expired += 1
        return acc
      },
      { all: 0, online: 0, offline: 0, inWarranty: 0, expired: 0 }
    )
  }, [search, totals, searchFiltered])

  const filtered = useMemo(() => {
    return searchFiltered.filter((item) => {
      switch (activeFilter) {
        case 'online': return item.camera.online > 0
        case 'offline': return item.camera.offline > 0
        case 'in-warranty': return item.is_warranty
        case 'expired': return !item.is_warranty
        default: return true
      }
    })
  }, [searchFiltered, activeFilter])

  // Export rows in the SAME order the table displays: grouped by แขวง
  // (bureau) — mirrors CamerasTableCctv's grouping so the printed report
  // reads exactly like the screen.
  const exportRows = useMemo(() => {
    const groups = new Map<string, CCTVOverviewRow[]>()
    for (const it of filtered) {
      const list = groups.get(it.bureau) ?? []
      list.push(it)
      groups.set(it.bureau, list)
    }
    return [...groups.values()].flat()
  }, [filtered])

  if (listLoading) return <Skeleton active paragraph={{ rows: 8 }} />

  return (
    <div className='flex flex-col gap-5'>
      {/* ── Map + side rails — 3-column grid on desktop, stacked on mobile ── */}
      <MapFocusGrid>

        {/* LEFT — camera preview list */}
        <MapOverlayPanel
          position='left'
          className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
        >
          <CameraListCctv cameras={randomOnline} />
        </MapOverlayPanel>

        {/* CENTER — Map */}
        <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
          <MapSectionCctv
            deptId={deptId}
            roadId={roadId}
            edgeFade={{ all: 20 }}
          />
        </div>

        {/* RIGHT — search button + stats cards */}
        <MapOverlayPanel
          position='right'
          className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
        >
          <Button
            block
            type='primary'
            size='large'
            shape='round'
            // Carry the CURRENT page's scope into the search page — arriving
            // from the nationwide view (?scope=all) must keep every bureau's
            // roads searchable; dropping it silently narrows the search to
            // the single ทช.ส่วนกลาง group (1 road / 22 cameras).
            onClick={() => {
              const q = new URLSearchParams()
              if (deptId) q.set('dept_id', deptId)
              if (scopeAll) q.set('scope', 'all')
              const qs = q.toString()
              router.push(`/admin/cctv/search${qs ? `?${qs}` : ''}`)
            }}
          >
            ค้นหากล้อง CCTV รายสายทาง
          </Button>
          <StatsSectionCctv totals={totals ?? null} roadId={roadId} />
        </MapOverlayPanel>
      </MapFocusGrid>

      {/* ── Filter bar ── */}
      <section>
        <SearchBar
          filters={CCTV_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchCctv onSearchChange={setSearch} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
            shows), matching the old drr-cm-fe CCTV overview report columns. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filtered.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'CCTV_Overview_Report',
            title: 'รายงานสรุปภาพรวมกล้องวงจรปิด (CCTV Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(CCTV_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'CCTV_Overview_Report',
            sheetName: 'CCTV Overview',
            title: 'รายงานสรุปภาพรวมกล้องวงจรปิด (CCTV Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(CCTV_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      {/* ── Table / Card grid ── */}
      <section>
        {viewMode === 'TABLE' ? (
          <CamerasTableCctv items={filtered} loading={listLoading} />
        ) : (
          <CardGridCctv items={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
