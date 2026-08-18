import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TableVMSData } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import FormSearchVMS, { FormValues } from './FormSearchVMS'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setSearchVMSList } from '@/stores/reducers/vms/vmsOverviewSlice'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSOverviewListAPI, getVMSOverviewTotalAPI } from '@/services/routes/VMSService'
import { useScopeAll } from '@/hooks/useScopeAll'
import type { APIResponseVMSList, ListSolution } from '@/types/vms/overview-api'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import { matchesSearchTerm } from '@/utils/searchMatch'


interface Props {
  deptId?: string | string[] | number
  roadId?: string | string[] | number
}

// The backend has been observed returning the same solution nested under two
// different department nodes in one central/list response — most visible
// when filtering to a single road_id, since a road can straddle two แขวง
// boundaries. TableVMSData/ProjectCardGrid both key rows by solution.id alone
// (not department-scoped), so an unfiltered duplicate crashes into a React
// "duplicate key" warning and silently doubles up export rows. Dedupe once
// here, keeping the first occurrence, same pattern as incident-detection's
// dedupeSolutions (useLiveIncidentRouteItems.ts).
const dedupeVMSSolutions = (depts: APIResponseVMSList): APIResponseVMSList => {
  const seen = new Set<number | string>()
  return depts.map((dept) => ({
    ...dept,
    sub_department: (dept.sub_department ?? []).map((sub) => ({
      ...sub,
      solutions: (sub.solutions ?? []).filter((sol) => {
        if (seen.has(sol.solution.id)) return false
        seen.add(sol.solution.id)
        return true
      }),
    })),
  }))
}

// Rebuild the dept → sub_dept → solutions tree keeping only the solutions the
// predicate accepts; sub-depts / depts that end up empty are dropped so the
// table renders no dangling สำนัก/แขวง header rows. `bureau` is the combined
// dept + sub-dept label, so a search can match either grouping header.
const pruneVMSTree = (
  depts: APIResponseVMSList,
  keep: (sol: ListSolution, bureau: string) => boolean,
): APIResponseVMSList =>
  depts
    .map((dept) => ({
      ...dept,
      sub_department: (dept.sub_department ?? [])
        .map((sub) => ({
          ...sub,
          solutions: (sub.solutions ?? []).filter((sol) =>
            keep(sol, `${dept.department_short_name} ${sub.department_short_name}`)
          ),
        }))
        .filter((sub) => sub.solutions.length > 0),
    }))
    .filter((dept) => dept.sub_department.length > 0)

const VMS_FILTERS: FilterConfig[] = [
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

// Export row = one solution flattened out of the dept → sub-dept tree, tagged
// with the สำนัก header label the on-screen table groups by.
type VMSExportRow = ListSolution & { bureau: string }

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (รหัสสายทาง → ชื่อโครงการ → จุดติดตั้ง →
// เลขที่สัญญา → การค้ำประกัน → สถานะ → Stream → กล้อง), plus ลำดับ/หน่วยงาน
// since the export flattens the table's per-สำนัก header rows. `width` =
// Excel chars, `widthPct` = PDF table percent (sums to 100).
const VMS_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: VMSExportRow, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'หน่วยงาน', width: 16, widthPct: 9, value: (r) => r.bureau || '-' },
    { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.road.code_name || '-' },
    { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.project.project_name || '-' },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 17, align: 'left', value: (r) => r.solution.solution_name || '-' },
    // Same fallback chain as the on-screen ContractInfoCell (contract → budget year).
    { header: 'เลขที่สัญญา', width: 20, widthPct: 12, value: (r) => r.project.contract_no || (r.project.budget_year ? `ปีงบประมาณ ${r.project.budget_year}` : '-') },
    { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty.is_warranty ? 'ในค้ำ' : 'หมดค้ำ') },
    { header: 'สถานะ', width: 10, widthPct: 8, value: (r) => (r.vms.status.is_online ? 'ออนไลน์' : 'ออฟไลน์') },
    { header: 'Stream', width: 11, widthPct: 7.5, value: (r) => (r.vms.hls_url ? 'Connect' : 'Disconnect') },
    { header: 'กล้อง', width: 11, widthPct: 7.5, value: (r) => (r.vms.desktop_screen ? 'Connect' : 'ไม่มีกล้อง') },
  ]

const DataDisplaySection: React.FC<Props> = (props) => {
  const { deptId, roadId } = props
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query keys re-derive when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)
  const { vms_list } = useAppSelector(state => state.vms_overview)

  // Fetch totals directly instead of reading from Redux — same query key as
  // InfoCardSection so both components share one cached response, no extra
  // request. Redux is no longer the source of truth here (per CLAUDE.md:
  // do NOT add server-fetched data to slices).
  const { data: totals } = useQuery({
    queryKey: ['vms_total', String(deptId ?? ''), scope, String(roadId ?? '')],
    queryFn: () => getVMSOverviewTotalAPI(Number(deptId)!, roadId ? { road_id: roadId } : {}),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  // The search term is NOT a request param — `/vms/departments/{id}/overview/
  // central/list` ignores `search` (same as bridge-lighting's twin endpoint),
  // so sending it only refetched the identical full list on every keystroke.
  // Filtering happens client-side below, like every other overall page.
  // Base params stay `{ page:1, limit:10 }` so this shares InfoCardSection's
  // cache entry (see the comment there) regardless of what's typed.
  const listParams = useMemo(
    () => ({ page: vms_list.search.page, limit: vms_list.search.limit }),
    [vms_list.search.page, vms_list.search.limit]
  )

  const { data, isLoading } = useQuery({
    // dept + scope + road in the key — previously only the search text, so
    // switching departments/roads/entry point reused the other's cached list.
    queryKey: ['vms_list', String(deptId ?? ''), scope, String(roadId ?? ''), listParams],
    queryFn: () => getVMSOverviewListAPI(Number(deptId)!, roadId ? { road_id: roadId, ...listParams } : listParams),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  // Deduped once here (see dedupeVMSSolutions above) — shared by the badge
  // tally below and filteredData, so both agree with what the table/grid/
  // export actually render.
  const dedupedData = useMemo<APIResponseVMSList | undefined>(
    () => (data?.data ? dedupeVMSSolutions(data.data) : data?.data),
    [data]
  )

  // Solutions matching the search box ONLY (independent of the status filter) —
  // the base set for both the badge counts and the table, mirroring CCTV's
  // `searchFiltered`. Matches the same fields the table shows: สำนัก/แขวง,
  // รหัสสายทาง, ชื่อโครงการ, จุดติดตั้ง, เลขที่สัญญา.
  const searchFilteredData = useMemo<APIResponseVMSList | undefined>(() => {
    if (!dedupedData) return dedupedData
    const term = vms_list.search.search?.trim().toLowerCase()
    if (!term) return dedupedData
    return pruneVMSTree(dedupedData, (sol, bureau) =>
      matchesSearchTerm(term, {
        codes: [sol.road.code_name, sol.solution.solution_name],
        text: [bureau, sol.project.project_name, sol.project.contract_no],
      })
    )
  }, [dedupedData, vms_list.search.search])

  // With no search, badge counts come from the authoritative totals endpoint.
  // Once a search is active, re-tally the search-matching solutions (all
  // statuses) so the badges track the search (requested 2026-07-24).
  const vmsStats = useMemo<FilterStats>(() => {
    const term = vms_list.search.search?.trim()
    if (!term) {
      return {
        all: totals?.data.solution.total ?? 0,
        online: totals?.data.solution.online ?? 0,
        offline: totals?.data.solution.offline ?? 0,
        inWarranty: totals?.data.warranty.active ?? 0,
        expired: totals?.data.warranty.expired ?? 0,
      }
    }
    let all = 0, online = 0, offline = 0, inWarranty = 0, expired = 0
    for (const dept of searchFilteredData ?? []) {
      for (const sub of dept.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          all++
          if (sol.vms.status.is_online) online++
          else offline++
          if (sol.warranty.is_warranty) inWarranty++
          else expired++
        }
      }
    }
    return { all, online, offline, inWarranty, expired }
  }, [totals, searchFilteredData, vms_list.search.search])

  // Status filter, applied on top of the search-filtered set — the API's
  // status_name/warranty_name params don't match the FilterConfig keys
  // ('online'/'offline'/'in-warranty'/'expired'), so this also happens on the
  // loaded response.
  const filteredData = useMemo<APIResponseVMSList | undefined>(() => {
    if (!searchFilteredData) return searchFilteredData
    if (activeFilter === 'all') return searchFilteredData
    return pruneVMSTree(searchFilteredData, (sol) => {
      switch (activeFilter) {
        case 'online': return sol.vms.status.is_online === true
        case 'offline': return sol.vms.status.is_online === false
        case 'in-warranty': return sol.warranty.is_warranty === true
        case 'expired': return sol.warranty.is_warranty === false
        default: return true
      }
    })
  }, [searchFilteredData, activeFilter])

  // Flatten dept → sub-dept → solutions into card items, tagging each with its
  // sub-dept short name so ProjectCardGrid groups by แขวง out of the box
  // (same adapter shape crosswalk feeds the shared grid).
  const cardItems = useMemo<ProjectCardItem[]>(() => {
    const out: ProjectCardItem[] = []
    for (const dept of filteredData ?? []) {
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
            isWarranty: sol.warranty.is_warranty === true,
            bureau: sub.department_short_name,
            total: sol.online_count + sol.offline_count,
            online: sol.online_count,
            offline: sol.offline_count,
            onDetail: () =>
              router.push(
                `/admin/vms/detail/${sol.solution.id}?is_warranty=${sol.warranty.is_warranty}&is_online=${sol.vms.status.is_online}`,
              ),
          })
        }
      }
    }
    return out
  }, [filteredData, router])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableVMSData data={filteredData} loading={isLoading} />
      case 'GRID':
        return <ProjectCardGrid items={cardItems} totalLabel='กล้องทั้งหมด' />
      default:
        return null
    }
  }, [displayType, filteredData, isLoading, cardItems])

  // Export rows in the SAME order the table displays: flattened dept →
  // sub-dept → solutions, each tagged with the สำนัก header label the table
  // groups by — so the printed report reads exactly like the screen.
  const exportRows = useMemo<VMSExportRow[]>(() => {
    const out: VMSExportRow[] = []
    for (const dept of filteredData ?? []) {
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
    const filterLabel = VMS_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    const term = vms_list.search.search?.trim()
    if (term) parts.push(`ค้นหา "${term}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, vms_list.search.search])

  const onSearch = useCallback((formData: FormValues) => {
    dispatch(setSearchVMSList({
      ...vms_list.search,
      ...formData,
      page: 1,
    }))
  }, [dispatch, vms_list.search])

  return (
    <div>
      <section>
        <SearchBar
          filters={VMS_FILTERS}
          stats={vmsStats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          formSearch={<FormSearchVMS onSearch={onSearch} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the
            table/card grid shows), mirroring the CCTV overview report. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Overview_Report',
            title: 'รายงานสรุปภาพรวมป้าย VMS (VMS Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(VMS_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Overview_Report',
            title: 'รายงานสรุปภาพรวมป้าย VMS (VMS Overview)',
            filterNote: exportFilterNote,
            sheetName: 'VMS Overview',
            columns: hideProjectNameColumns(VMS_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
