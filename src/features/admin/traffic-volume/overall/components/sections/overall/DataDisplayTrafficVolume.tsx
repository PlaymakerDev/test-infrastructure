"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React, { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTrafficVolume from './FormSearchTrafficVolume'
import TableTrafficVolume from './TableTrafficVolume'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useTrafficVolumeCentralList } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import type { TrafficVolumeProject } from '@/features/admin/traffic-volume/overall/data/trafficVolumes'
import type { CountingCentralSolution } from '@/types/traffic-volume/overview-api'

interface Props { }

const TRAFFIC_VOLUME_FILTERS: FilterConfig[] = [
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

/** Adapter: central-list solution row → UI `TrafficVolumeProject`. Bureau is
 *  filled by the caller because it lives one level up in the nested response.
 *  Fields the endpoint does not return (`stationType`, `coord`, live PCU /
 *  speed metrics) stay undefined — the table renders "-" for them. */
const apiSolutionToProject = (
  item: CountingCentralSolution,
  bureau: string
): TrafficVolumeProject => {
  return {
    id: String(item.solution.id),
    projectId: String(item.project.id),
    roadId: String(item.road.id),
    roadCode: item.road.code_name,
    projectName: item.project.project_name,
    installPoint: item.solution.solution_name,
    contractNo: item.project.contract_no,
    budgetYear: item.project.budget_year,
    warranty: item.is_warranty ? 'in-warranty' : 'expired',
    connection: item.camera.is_online ? 'online' : 'offline',
    // Treat any online camera as "stream connected" — mirrors traffic-signal.
    stream: item.online_count > 0,
    bureau,
    totalDevices: item.camera.total,
    onlineDevices: item.online_count,
    offlineDevices: item.offline_count,
    // `camera.count` is the live vehicle count (ปริมาณจราจร).
    trafficCount: item.camera.count,
  }
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → ชื่อโครงการ → จุดติดตั้ง →
// เลขที่สัญญา → การค้ำประกัน → กล้องนับรถ → ปริมาณจราจร → สถานะ), plus
// ลำดับ/หน่วยงาน since the export flattens the table's per-สำนัก divider
// rows (mirrors CCTV_EXPORT_COLUMNS). License (action) + Stream columns are
// skipped. `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const TRAFFIC_VOLUME_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: TrafficVolumeProject, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.roadCode || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 19, align: 'left', value: (r) => r.projectName || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 19, align: 'left', value: (r) => r.installPoint || '-' },
  {
    header: 'เลขที่สัญญา',
    width: 20,
    widthPct: 12,
    // Mirrors ContractInfoCell: contract number, falling back to the
    // budget year when the project has no contract on record.
    value: (r) =>
      r.contractNo.trim()
        ? r.contractNo
        : r.budgetYear
          ? `ปีงบประมาณ ${r.budgetYear}`
          : '-',
  },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ') },
  { header: 'กล้องนับรถ', width: 11, widthPct: 6, value: (r) => r.totalDevices },
  { header: 'ปริมาณจราจร (คัน)', width: 15, widthPct: 6, value: (r) => r.trafficCount ?? '-' },
  { header: 'สถานะ', width: 10, widthPct: 6, value: (r) => (r.connection === 'online' ? 'ออนไลน์' : 'ออฟไลน์') },
]

const DataDisplayTrafficVolume: React.FC<Props> = () => {
  const deptId = useDeptId()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  const goToDetail = useCallback((p: TrafficVolumeProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-volume/detail/${p.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])

  // Backend defaults are page=1, limit=100; pin them here so the URL is stable
  // for cache key + matches the Postman sample we verified against.
  const { data, isLoading } = useTrafficVolumeCentralList(deptId, {
    page: 1,
    limit: 100,
  })

  // Flatten bureau → sub-dept → solutions, tagging each row with its
  // sub-dept short name so the table groups by bureau out of the box.
  const projects: TrafficVolumeProject[] = useMemo(() => {
    const out: TrafficVolumeProject[] = []
    for (const bureau of data ?? []) {
      for (const subDept of bureau.sub_department) {
        for (const sol of subDept.solutions) {
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
    [projects]
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

  // Export rows in the SAME order the table displays: grouped by สำนัก
  // (bureau) — mirrors TableTrafficVolume's groupByBureau bucketing so the
  // printed report reads exactly like the screen.
  const exportRows = useMemo(() => {
    const groups = new Map<string, TrafficVolumeProject[]>()
    for (const p of filtered) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }
    return [...groups.values()].flat()
  }, [filtered])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = TRAFFIC_VOLUME_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

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
        total: p.totalDevices,
        online: p.onlineDevices,
        offline: p.offlineDevices,
        onDetail: () => goToDetail(p),
      })),
    [filtered, goToDetail]
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={TRAFFIC_VOLUME_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          formSearch={<FormSearchTrafficVolume onSearchChange={setSearch} />}
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
            filenameBase: 'Traffic_Volume_Overview_Report',
            title: 'รายงานสรุปภาพรวมปริมาณจราจร (Traffic Volume Overview)',
            filterNote: exportFilterNote,
            columns: TRAFFIC_VOLUME_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Volume_Overview_Report',
            sheetName: 'Traffic Volume Overview',
            columns: TRAFFIC_VOLUME_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableTrafficVolume projects={filtered} loading={isLoading} />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='อุปกรณ์ทั้งหมด' />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplayTrafficVolume)
