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

const ID_FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ', statKey: 'inWarranty', colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white', badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]' },
  { key: 'expired', label: 'หมดค้ำ', colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white', badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

const DataDisplaySection: React.FC = () => {
  const deptId = useDeptId()
  const router = useRouter()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const goToDetail = useCallback((r: IncidentRow) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/incident-detection/detail/${r.id}?${params}${scopeQuerySuffix()}`)
  }, [router, deptId])

  const { data: central, isLoading } = useIncidentCentralList(deptId)
  const { data: totals } = useIncidentCentralTotals(deptId)

  // Flatten bureau → sub-dept(แขวง) → solutions, tagging each row with its แขวง
  // so both tables group by bureau. The central-list `camera` object is
  // inconsistent — some solutions omit online_count, some omit offline_count —
  // so derive whichever is missing from `total` (avoids NaN).
  const allRows = useMemo<IncidentRow[]>(() => {
    const rows: IncidentRow[] = []
    for (const bureau of central ?? []) {
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

  // Chip counts are SOLUTION-level so they match what each filter shows (a chip
  // filters rows, not cameras). all/ในค้ำ/หมดค้ำ come from central/totals
  // (authoritative, same scope as the table). online/offline stay row-derived:
  // the analytic totals API only exposes camera-level online/offline, not
  // per-solution status, so counting rows is the only way to match the filter.
  const stats: FilterStats = useMemo(
    () => ({
      all: totals ? totals.warranty.active + totals.warranty.expired : allRows.length,
      online: allRows.filter((r) => r.onlineCameras > 0).length,
      offline: allRows.filter((r) => r.offlineCameras > 0).length,
      inWarranty: totals?.warranty.active ?? allRows.filter((r) => r.warranty === 'in-warranty').length,
      expired: totals?.warranty.expired ?? allRows.filter((r) => r.warranty === 'expired').length,
    }),
    [totals, allRows]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allRows.filter((r) => {
      switch (activeFilter) {
        case 'online': if (r.onlineCameras === 0) return false; break
        case 'offline': if (r.offlineCameras === 0) return false; break
        case 'in-warranty': if (r.warranty !== 'in-warranty') return false; break
        case 'expired': if (r.warranty !== 'expired') return false; break
      }
      if (term) {
        const hay = `${r.roadCode} ${r.projectName} ${r.installPoint} ${r.contractNo} ${r.bureau}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [allRows, activeFilter, search])

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
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
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
