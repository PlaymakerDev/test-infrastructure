"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { SummaryTableBridgeLighting } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import FormSearchBridgeLighting from './FormSearchBridgeLighting'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import { useScopeAll } from '@/hooks/useScopeAll'
import { getBridgeLightingListAPI, getBridgeLightingTotalAPI } from '@/services/routes/BridgeLightingService'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import type { APIResponseBridgeLightingList, BridgeLightingSolution } from '@/types/bridge-lighting/overall-api'

const BRIDGE_FILTERS: FilterConfig[] = [
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

// Export row = one solution tagged with the top-level department the table's
// group-header row shows — the export flattens those divider rows into a
// หน่วยงาน column (same treatment as CCTV_EXPORT_COLUMNS in cctv/overall).
type BridgeLightingExportRow = BridgeLightingSolution & { bureau: string }

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen SummaryTableBridgeLighting (รหัสสายทาง → ชื่อโครงการ
// → จุดติดตั้ง → เลขที่สัญญา → การค้ำประกัน → สถานะ), plus ลำดับ/หน่วยงาน up
// front. `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const BRIDGE_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: BridgeLightingExportRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 12, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 11, value: (r) => r.road.code_name || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 22, align: 'left', value: (r) => r.project.project_name || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 22, align: 'left', value: (r) => r.solution.solution_name || '-' },
  // Same fallback chain as the on-screen ContractInfoCell (contract → budget year).
  { header: 'เลขที่สัญญา', width: 20, widthPct: 12, value: (r) => r.project.contract_no || (r.project.budget_year ? `ปีงบประมาณ ${r.project.budget_year}` : '-') },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.is_warranty ? 'ในค้ำ' : 'หมดค้ำ') },
  { header: 'สถานะ', width: 12, widthPct: 8, value: (r) => (r.is_online ? 'ออนไลน์' : 'ออฟไลน์') },
]

interface Props {
  deptId: string | string[] | number
}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { deptId } = props
  const router = useRouter()
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query keys re-derive when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  // Same query key InfoCardSection uses — both hit the same cache entry,
  // no extra request.
  const { data: totals } = useQuery({
    queryKey: ['bridge_lighting_total', String(deptId ?? ''), scope],
    queryFn: () => getBridgeLightingTotalAPI(String(deptId)!, { scope }),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  const stats: FilterStats = useMemo(() => ({
    all: totals?.data.solution.total ?? 0,
    online: totals?.data.solution.online ?? 0,
    offline: totals?.data.solution.offline ?? 0,
    inWarranty: totals?.data.warranty.active ?? 0,
    expired: totals?.data.warranty.expired ?? 0,
  }), [totals])

  const { data, isLoading } = useQuery({
    queryKey: ['bridge_lighting_list', String(deptId ?? ''), scope],
    queryFn: () => getBridgeLightingListAPI(String(deptId)!, { scope }),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  // Client-side filter — the API's request params only carry `scope` (no
  // status/warranty/search params), so both the SearchBar filter buttons and
  // the search box filter the already-loaded list here, same as InfoCardSection's
  // stat aggregation. Rebuilds the same dept → sub_department → solutions tree
  // with only the matching solutions kept; sub-depts / depts that end up empty
  // are dropped so no empty headers show.
  const filteredData = useMemo<APIResponseBridgeLightingList>(() => {
    const list = data?.data ?? []
    const term = search.trim().toLowerCase()
    const solutionMatches = (sol: BridgeLightingSolution, bureau: string) => {
      switch (activeFilter) {
        case 'online': if (!sol.is_online) return false; break
        case 'offline': if (sol.is_online) return false; break
        case 'in-warranty': if (!sol.is_warranty) return false; break
        case 'expired': if (sol.is_warranty) return false; break
      }
      if (term) {
        const haystack = `${sol.road.code_name} ${sol.project.project_name} ${sol.solution.solution_name} ${sol.project.contract_no} ${bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    }
    return list
      .map((dept) => ({
        ...dept,
        sub_department: (dept.sub_department ?? [])
          .map((sub) => ({
            ...sub,
            solutions: (sub.solutions ?? []).filter((sol) => solutionMatches(sol, sub.department_short_name)),
          }))
          .filter((sub) => sub.solutions.length > 0),
      }))
      .filter((dept) => dept.sub_department.length > 0)
  }, [data, activeFilter, search])

  // Export rows in the SAME order the table displays: grouped by top-level
  // dept (SummaryTableBridgeLighting's header rows), each solution tagged with
  // that dept's short name — exports exactly the filtered rows on screen.
  const exportRows = useMemo<BridgeLightingExportRow[]>(() => {
    const out: BridgeLightingExportRow[] = []
    for (const dept of filteredData) {
      for (const sub of dept.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          out.push({ ...sol, bureau: dept.department_short_name })
        }
      }
    }
    return out
  }, [filteredData])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = BRIDGE_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  // Flatten dept → sub-dept → solutions into card items, tagging each with its
  // sub-dept short name so ProjectCardGrid groups by แขวง out of the box —
  // same adapter shape vms/overall feeds the shared grid. A bridge-lighting
  // solution is a single install point (no online_count/offline_count group
  // like VMS), so total is always 1, split into online/offline by is_online.
  const cardItems = useMemo<ProjectCardItem[]>(() => {
    const out: ProjectCardItem[] = []
    for (const dept of filteredData) {
      for (const sub of dept.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          out.push({
            key: String(sol.solution.id),
            roadId: sol.road.id,
            projectId: sol.project.id,
            roadCode: sol.road.code_name,
            projectName: sol.project.project_name || '-',
            installPoint: sol.solution.solution_name,
            contractNo: sol.project.contract_no,
            budgetYear: sol.project.budget_year,
            isWarranty: sol.is_warranty === true,
            bureau: sub.department_short_name,
            total: 1,
            online: sol.is_online ? 1 : 0,
            offline: sol.is_online ? 0 : 1,
            onDetail: () => {
              // dept_id + is_warranty, plus the current page's scope forwarded via
              // scopeQuerySuffix() — same URL pattern as SummaryTableBridgeLighting's goToDetail.
              const params = new URLSearchParams({
                dept_id: String(deptId),
                is_warranty: String(sol.is_warranty),
                project_id: String(sol.project.id),
              })
              router.push(`/admin/bridge-lighting/detail/${sol.solution.id}?${params}${scopeQuerySuffix()}`)
            },
          })
        }
      }
    }
    return out
  }, [filteredData, router, deptId])

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return <SummaryTableBridgeLighting data={filteredData} loading={isLoading} />
      case 'GRID':
        return <ProjectCardGrid items={cardItems} totalLabel='ดวงไฟทั้งหมด' />
      default:
        return null
    }
  }, [viewMode, filteredData, isLoading, cardItems])

  return (
    <div>
      <section>
        <SearchBar
          filters={BRIDGE_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          formSearch={<FormSearchBridgeLighting onSearchChange={setSearch} />}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
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
            filenameBase: 'Bridge_Lighting_Overview_Report',
            title: 'รายงานสรุปภาพรวมไฟประดับสะพาน (Bridge Lighting Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(BRIDGE_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Bridge_Lighting_Overview_Report',
            sheetName: 'Bridge Lighting Overview',
            title: 'รายงานสรุปภาพรวมไฟประดับสะพาน (Bridge Lighting Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(BRIDGE_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />
      <section id='bridge-lighting-summary-table' className='mt-5 scroll-mt-24'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
