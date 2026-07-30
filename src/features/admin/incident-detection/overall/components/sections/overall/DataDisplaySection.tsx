"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import FormSearchIncidentDetection from './FormSearchIncidentDetection'
import TableIncidentDetectionData from './TableIncidentDetectionData'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import { useIncidentCentralList, useIncidentCentralTotals } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentRow } from '@/features/admin/incident-detection/overall/data/incidentData'
import { dedupeIncidentSolutions } from '@/features/admin/incident-detection/overall/data/incidentData'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'

interface Props {
  roadId?: string | null
}

const ID_FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ', statKey: 'inWarranty', colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white', badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]' },
  { key: 'expired', label: 'หมดค้ำ', colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white', badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → … → Stream), plus ลำดับ/หน่วยงาน
// since the export flattens the per-แขวง divider rows (mirrors
// CCTV_EXPORT_COLUMNS). The License column is skipped — it's an action button
// (fetch-on-click modal), not row data. `width` = Excel chars, `widthPct` =
// PDF table percent (sums to 100).
const ID_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: IncidentRow, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'หน่วยงาน', width: 16, widthPct: 9, value: (r) => r.bureau || '-' },
    { header: 'รหัสสายทาง', width: 13, widthPct: 8, value: (r) => r.roadCode || '-' },
    { header: 'ชื่อโครงการ', width: 34, widthPct: 16, align: 'left', value: (r) => r.projectName || '-' },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 16, align: 'left', value: (r) => r.installPoint || '-' },
    {
      header: 'เลขที่สัญญา',
      width: 20,
      widthPct: 11,
      // Same fallback chain as the on-screen ContractInfoCell.
      value: (r) => (r.contractNo?.trim() ? r.contractNo : r.budgetYear ? `ปีงบประมาณ ${r.budgetYear}` : '-'),
    },
    { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ') },
    { header: 'กล้องวิเคราะห์', width: 13, widthPct: 8, value: (r) => r.totalCameras },
    { header: 'เหตุการณ์', width: 10, widthPct: 6, value: (r) => r.events },
    { header: 'สถานะ', width: 10, widthPct: 7, value: (r) => (r.onlineCameras > 0 ? 'ออนไลน์' : 'ออฟไลน์') },
    { header: 'Stream', width: 11, widthPct: 6, value: (r) => (r.onlineCameras > 0 ? 'Connect' : 'Disconnect') },
  ]

const DataDisplaySection: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  const router = useRouter()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const goToDetail = useCallback((r: IncidentRow) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/incident-detection/detail/${r.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])

  const { data: central, isLoading } = useIncidentCentralList(deptId, roadId ? { road_id: Number(roadId) } : {})
  const { data: totals } = useIncidentCentralTotals(deptId, roadId ? { road_id: Number(roadId) } : {})

  // Flatten bureau → sub-dept(แขวง) → solutions, tagging each row with its แขวง
  // so both tables group by bureau. The central-list `camera` object is
  // inconsistent — some solutions omit online_count, some omit offline_count —
  // so derive whichever is missing from `total` (avoids NaN).
  const allRows = useMemo<IncidentRow[]>(() => {
    const rows: IncidentRow[] = []
    for (const bureau of dedupeIncidentSolutions(central ?? [])) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          const cam = sol.camera
          const total = cam.total ?? 0
          const online = cam.online_count ?? (cam.offline_count != null ? total - cam.offline_count : 0)
          const offline = cam.offline_count ?? (cam.online_count != null ? total - cam.online_count : 0)
          rows.push({
            id: String(sol.solution.id),
            projectId: String(sol.project.id),
            roadId: String(sol.road.id),
            roadCode: sol.road.code_name,
            projectName: sol.project.project_name,
            contractNo: sol.project.contract_no,
            budgetYear: sol.project.budget_year,
            warranty: sol.is_warranty ? 'in-warranty' : 'expired',
            installPoint: sol.solution.solution_name,
            bureau: sub.department_short_name,
            totalCameras: total,
            onlineCameras: Math.max(0, online),
            offlineCameras: Math.max(0, offline),
            events: cam.events_count,
          })
        }
      }
    }
    return rows
  }, [central])

  // Rows matching the search box ONLY (independent of the status filter) — base
  // set for both the badge counts and the table.
  const searchFiltered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allRows
    return allRows.filter((r) => {
      const hay = `${r.roadCode} ${r.projectName} ${r.installPoint} ${r.contractNo} ${r.bureau}`.toLowerCase()
      return hay.includes(term)
    })
  }, [allRows, search])

  // Chip counts are SOLUTION-level so they match what each filter shows (a chip
  // filters rows, not cameras). With no search, all/ในค้ำ/หมดค้ำ come from
  // central/totals (authoritative, same scope as the table) and online/offline
  // stay row-derived (the analytic totals API only exposes camera-level
  // online/offline). Once a search is active, every count re-tallies the
  // matching rows so the badges track the search (requested 2026-07-24).
  const stats: FilterStats = useMemo(() => {
    const hasSearch = search.trim().length > 0
    if (!hasSearch) {
      return {
        all: totals ? totals.warranty.active + totals.warranty.expired : allRows.length,
        online: allRows.filter((r) => r.onlineCameras > 0).length,
        offline: allRows.filter((r) => r.offlineCameras > 0).length,
        inWarranty: totals?.warranty.active ?? allRows.filter((r) => r.warranty === 'in-warranty').length,
        expired: totals?.warranty.expired ?? allRows.filter((r) => r.warranty === 'expired').length,
      }
    }
    return {
      all: searchFiltered.length,
      online: searchFiltered.filter((r) => r.onlineCameras > 0).length,
      offline: searchFiltered.filter((r) => r.offlineCameras > 0).length,
      inWarranty: searchFiltered.filter((r) => r.warranty === 'in-warranty').length,
      expired: searchFiltered.filter((r) => r.warranty === 'expired').length,
    }
  }, [search, totals, allRows, searchFiltered])

  const filtered = useMemo(() => {
    return searchFiltered.filter((r) => {
      switch (activeFilter) {
        case 'online': return r.onlineCameras > 0
        case 'offline': return r.offlineCameras > 0
        case 'in-warranty': return r.warranty === 'in-warranty'
        case 'expired': return r.warranty === 'expired'
        default: return true
      }
    })
  }, [searchFiltered, activeFilter])

  // Export rows in the SAME order the table displays: grouped by แขวง (bureau)
  // — mirrors TableIncidentDetectionData's grouping so the printed report
  // reads exactly like the screen.
  const exportRows = useMemo(() => {
    const groups = new Map<string, IncidentRow[]>()
    for (const r of filtered) {
      const list = groups.get(r.bureau) ?? []
      list.push(r)
      groups.set(r.bureau, list)
    }
    return [...groups.values()].flat()
  }, [filtered])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = ID_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  const cardItems = useMemo<ProjectCardItem[]>(
    () =>
      filtered.map((r) => ({
        key: r.id,
        roadId: Number(r.roadId),
        projectId: r.projectId,
        roadCode: r.roadCode,
        projectName: r.projectName,
        installPoint: r.installPoint,
        contractNo: r.contractNo,
        budgetYear: r.budgetYear,
        isWarranty: r.warranty === 'in-warranty',
        bureau: r.bureau,
        total: r.totalCameras,
        online: r.onlineCameras,
        offline: r.offlineCameras,
        onDetail: () => goToDetail(r),
      })),
    [filtered, goToDetail]
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={ID_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          formSearch={<FormSearchIncidentDetection onSearchChange={setSearch} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Incident_Detection_Overview_Report',
            title: 'รายงานสรุปภาพรวมระบบตรวจจับเหตุการณ์ (Incident Detection Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(ID_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Incident_Detection_Overview_Report',
            sheetName: 'Incident Detection Overview',
            title: 'รายงานสรุปภาพรวมระบบตรวจจับเหตุการณ์ (Incident Detection Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(ID_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {displayType === 'TABLE' ? (
          <TableIncidentDetectionData rows={filtered} loading={isLoading} />
        ) : (
          <ProjectCardGrid items={cardItems} />
        )}
      </section>
    </div>
  )
}

export default React.memo(DataDisplaySection)
