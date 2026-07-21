"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchCrosswalk from './FormSearchCrosswalk'
import TableCrosswalkData from './TableCrosswalkData'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import { useCrosswalkCentralList } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import type { CrosswalkProject } from '@/features/admin/crosswalk/overall/data/crosswalk'
import type { CrosswalkCentralSolution } from '@/types/crosswalk/overview-api'
import ExportFileModal from '@/components/export/ExportFileModal'

interface Props { }

const CROSSWALK_FILTERS: FilterConfig[] = [
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

/** Adapter: central-list solution row → UI `CrosswalkProject`. Bureau is
 *  filled by the caller because it lives one level up in the nested response.
 *  Crosswalk connection status comes from `crosswalk.is_online` (the ทางข้าม
 *  device health), NOT from the camera's online state. */
const apiSolutionToProject = (
  item: CrosswalkCentralSolution,
  bureau: string,
): CrosswalkProject => ({
  id: String(item.solution.id),
  projectId: String(item.project.id),
  roadId: String(item.road.id),
  roadCode: item.road.code_name,
  projectName: item.project.project_name,
  installPoint: item.solution.solution_name,
  contractNo: item.project.contract_no,
  budgetYear: item.project.budget_year,
  warranty: item.is_warranty ? 'in-warranty' : 'expired',
  connection: item.crosswalk.is_online ? 'online' : 'offline',
  bureau,
  totalCameras: item.camera.total,
  onlineCount: item.camera.online_count,
  offlineCount: item.camera.offline_count,
  totalCrosswalks: item.crosswalk.total,
})

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → ชื่อโครงการ → จุดติดตั้ง →
// เลขที่สัญญา → การค้ำประกัน → สถานะ → counts), plus ลำดับ/หน่วยงาน since the
// export flattens the table's per-แขวง divider rows. `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const CROSSWALK_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: CrosswalkProject, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 9, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 8, value: (r) => r.roadCode || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.projectName ?? '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 17, align: 'left', value: (r) => r.installPoint || '-' },
  // Same fallback ContractInfoCell renders on screen: no contract → budget year.
  {
    header: 'เลขที่สัญญา', width: 20, widthPct: 10,
    value: (r) => (r.contractNo.trim() ? r.contractNo : r.budgetYear ? `ปีงบประมาณ ${r.budgetYear}` : '-'),
  },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ') },
  { header: 'สถานะ', width: 10, widthPct: 7, value: (r) => (r.connection === 'online' ? 'ออนไลน์' : 'ออฟไลน์') },
  { header: 'กล้องทั้งหมด', width: 12, widthPct: 7, value: (r) => r.totalCameras },
  { header: 'ออนไลน์', width: 9, widthPct: 6, value: (r) => r.onlineCount },
  { header: 'ออฟไลน์', width: 9, widthPct: 6, value: (r) => r.offlineCount },
]

const OverallDataDisplaySection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading } = useCrosswalkCentralList(deptId)

  const goToDetail = useCallback(
    (p: CrosswalkProject) => {
      const params = new URLSearchParams({ dept_id: deptId })
      if (p.projectId) params.set('project_id', p.projectId)
      if (p.roadId) params.set('road_id', p.roadId)
      router.push(`/admin/crosswalk/detail/${p.id}?${params}${scopeQuerySuffix()}`)
    },
    [router, deptId],
  )

  // Flatten bureau → sub-dept → solutions, tagging each row with its
  // sub-dept short name so the table groups by bureau out of the box.
  const projects: CrosswalkProject[] = useMemo(() => {
    const out: CrosswalkProject[] = []
    for (const bureau of data ?? []) {
      for (const subDept of bureau.sub_department ?? []) {
        for (const sol of subDept.solutions ?? []) {
          out.push(apiSolutionToProject(sol, subDept.department_short_name))
        }
      }
    }
    return out
  }, [data])

  const stats: FilterStats = useMemo(
    () => ({
      all: projects.length,
      online: projects.filter((p) => p.connection === 'online').length,
      offline: projects.filter((p) => p.connection === 'offline').length,
      inWarranty: projects.filter((p) => p.warranty === 'in-warranty').length,
      expired: projects.filter((p) => p.warranty === 'expired').length,
    }),
    [projects],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter((p) => {
      switch (activeFilter) {
        case 'online': if (p.connection !== 'online') return false; break
        case 'offline': if (p.connection !== 'offline') return false; break
        case 'in-warranty': if (p.warranty !== 'in-warranty') return false; break
        case 'expired': if (p.warranty !== 'expired') return false; break
        case 'all': break
      }
      if (term) {
        const haystack = `${p.roadCode} ${p.projectName ?? ''} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search, projects])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = CROSSWALK_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  // Export rows in the SAME order the table displays: grouped by แขวง
  // (bureau) — mirrors TableCrosswalkData's groupByBureau so the printed
  // report reads exactly like the screen.
  const exportRows = useMemo(() => {
    const groups = new Map<string, CrosswalkProject[]>()
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
        projectName: p.projectName ?? '-',
        installPoint: p.installPoint,
        contractNo: p.contractNo,
        budgetYear: p.budgetYear,
        isWarranty: p.warranty === 'in-warranty',
        bureau: p.bureau,
        total: p.totalCameras,
        online: p.onlineCount,
        offline: p.offlineCount,
        onDetail: () => goToDetail(p),
      })),
    [filtered, goToDetail],
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={CROSSWALK_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchCrosswalk onSearchChange={setSearch} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
            shows), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filtered.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Crosswalk_Overview_Report',
            title: 'รายงานสรุปภาพรวมสัญญาณไฟทางข้ามอัจฉริยะ (Crosswalk Overview)',
            filterNote: exportFilterNote,
            columns: CROSSWALK_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Crosswalk_Overview_Report',
            sheetName: 'Crosswalk Overview',
            columns: CROSSWALK_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableCrosswalkData projects={filtered} loading={isLoading} />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='กล้องทั้งหมด' />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
