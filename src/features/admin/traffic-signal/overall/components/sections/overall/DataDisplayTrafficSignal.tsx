"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTrafficSignal from './FormSearchTrafficSignal'
import TableTrafficSignal from './TableTrafficSignal'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import { useTrafficCentralList, useTrafficTotals } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import type {
  TrafficSignalProject,
  SignalPhase,
  OperatingMode,
} from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import type { TrafficOverviewCentralSolution } from '@/types/traffic-signal/overview-api'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'

interface Props {}

const TRAFFIC_SIGNAL_FILTERS: FilterConfig[] = [
  {
    key: 'all', label: 'ทั้งหมด',
    colorPrimary: '#FCD116', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online', label: 'ออนไลน์',
    colorPrimary: '#66AEFF', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline', label: 'ออฟไลน์',
    colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
  {
    key: 'in-warranty', label: 'ในค้ำ', statKey: 'inWarranty',
    colorPrimary: '#05F2DB', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#016f64] text-white',
    badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]',
  },
  {
    key: 'expired', label: 'หมดค้ำ',
    colorPrimary: '#979797', colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → ชื่อโครงการ → จุดติดตั้ง →
// เลขที่สัญญา → การค้ำประกัน → Phase → สถานะ → Stream → โหมดการทำงาน), plus
// ลำดับ/หน่วยงาน since the export flattens the table's per-แขวง divider rows
// (mirrors CCTV_EXPORT_COLUMNS). `width` = Excel chars, `widthPct` = PDF
// table percent (sums to 100).
const TRAFFIC_SIGNAL_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: TrafficSignalProject, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.roadCode || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.projectName || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 17, align: 'left', value: (r) => r.installPoint || '-' },
  // Same fallback chain as the on-screen ContractInfoCell (contract → budget year).
  { header: 'เลขที่สัญญา', width: 20, widthPct: 11, value: (r) => r.contractNo || (r.budgetYear ? `ปีงบประมาณ ${r.budgetYear}` : '-') },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ') },
  { header: 'Phase', width: 8, widthPct: 5, value: (r) => r.phase },
  { header: 'สถานะ', width: 10, widthPct: 6, value: (r) => (r.connection === 'online' ? 'ออนไลน์' : 'ออฟไลน์') },
  { header: 'Stream', width: 12, widthPct: 6, value: (r) => (r.stream ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ') },
  { header: 'โหมดการทำงาน', width: 15, widthPct: 6, value: (r) => r.operatingMode || '-' },
]

/** Adapter: central-list solution row → UI `TrafficSignalProject`.
 *  Central endpoint carries every field the table needs (project_name +
 *  camera online/offline counts) so no placeholders are required. The bureau
 *  label is filled by the caller because it lives one level up in the
 *  nested response. */
const apiSolutionToProject = (
  item: TrafficOverviewCentralSolution,
  bureau: string,
): TrafficSignalProject => ({
  id: String(item.solution.id),
  projectId: String(item.project.id),
  roadId: String(item.road.id),
  roadCode: item.road.code_name,
  projectName: item.project.project_name,
  installPoint: item.solution.solution_name,
  contractNo: item.project.contract_no,
  budgetYear: item.project.budget_year,
  warranty: item.is_warranty ? 'in-warranty' : 'expired',
  connection: item.traffic.is_online ? 'online' : 'offline',
  // Stream is the *camera* health, not the controller heartbeat — a signal
  // can still stream from its cameras even when its controller drops, and
  // vice-versa. Treat any online camera as "stream connected".
  stream: item.online_count > 0,
  phase: (item.traffic.total_phases === 3 ? 3 : 4) as SignalPhase,
  operatingMode: item.traffic.controller_mode as OperatingMode,
  bureau,
  coord: [0, 0],
  totalCameras: item.online_count + item.offline_count,
  onlineCameras: item.online_count,
  offlineCameras: item.offline_count,
})

const DataDisplayTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  const goToDetail = useCallback((p: TrafficSignalProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-signal/detail/${p.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])

  // Bureau-aware list — single round-trip, no pagination, carries every
  // field the table needs (project name + camera counts + sub-dept grouping).
  const { data } = useTrafficCentralList(deptId)
  // Authoritative stats from backend.
  const { data: totals } = useTrafficTotals(deptId)

  // Flatten the bureau → sub-dept → solutions tree, tagging each row with its
  // sub-dept short name so the table groups by bureau out of the box.
  const projects: TrafficSignalProject[] = useMemo(() => {
    const out: TrafficSignalProject[] = []
    for (const bureau of data ?? []) {
      for (const subDept of bureau.sub_department) {
        for (const sol of subDept.solutions) {
          out.push(apiSolutionToProject(sol, subDept.department_short_name))
        }
      }
    }
    return out
  }, [data])

  // Stats prefer backend totals (whole-dept count, immune to pagination).
  // Falls back to client-side counting if totals haven't loaded yet.
  const stats: FilterStats = useMemo(() => {
    if (totals) {
      return {
        all: totals.solution.total,
        online: totals.solution.online,
        offline: totals.solution.offline,
        inWarranty: totals.warranty.active,
        expired: totals.warranty.expired,
      }
    }
    return {
      all: projects.length,
      online: projects.filter((p) => p.connection === 'online').length,
      offline: projects.filter((p) => p.connection === 'offline').length,
      inWarranty: projects.filter((p) => p.warranty === 'in-warranty').length,
      expired: projects.filter((p) => p.warranty === 'expired').length,
    }
  }, [totals, projects])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter((p) => {
      switch (activeFilter) {
        case 'online':      if (p.connection !== 'online') return false; break
        case 'offline':     if (p.connection !== 'offline') return false; break
        case 'in-warranty': if (p.warranty !== 'in-warranty') return false; break
        case 'expired':     if (p.warranty !== 'expired') return false; break
        case 'all':         break
      }
      if (term) {
        const haystack = `${p.roadCode} ${p.projectName} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search, projects])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = TRAFFIC_SIGNAL_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  // Export rows in the SAME order the table displays: grouped by แขวง
  // (bureau) — mirrors TableTrafficSignal's grouping so the printed report
  // reads exactly like the screen.
  const exportRows = useMemo(() => {
    const groups = new Map<string, TrafficSignalProject[]>()
    for (const p of filtered) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }
    return [...groups.values()].flat()
  }, [filtered])

  const cardItems = useMemo<ProjectCardItem[]>(
    () =>
      filtered.map((p) => ({
        key: p.id,
        roadId: Number(p.roadId),
        projectId: p.projectId,
        roadCode: p.roadCode,
        projectName: p.projectName,
        installPoint: p.installPoint,
        contractNo: p.contractNo,
        budgetYear: p.budgetYear,
        isWarranty: p.warranty === 'in-warranty',
        bureau: p.bureau,
        total: p.totalCameras,
        online: p.onlineCameras,
        offline: p.offlineCameras,
        onDetail: () => goToDetail(p),
      })),
    [filtered, goToDetail]
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={TRAFFIC_SIGNAL_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          formSearch={<FormSearchTrafficSignal onSearchChange={setSearch} />}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
            shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Signal_Overview_Report',
            title: 'รายงานสรุปภาพรวมสัญญาณไฟจราจร (Traffic Signal Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(TRAFFIC_SIGNAL_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Signal_Overview_Report',
            sheetName: 'Traffic Signal Overview',
            columns: hideProjectNameColumns(TRAFFIC_SIGNAL_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableTrafficSignal projects={filtered} />
        ) : (
          <ProjectCardGrid items={cardItems} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplayTrafficSignal)
