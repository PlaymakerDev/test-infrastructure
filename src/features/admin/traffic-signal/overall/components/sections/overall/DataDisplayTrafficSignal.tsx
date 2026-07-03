"use client"
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

  const goToDetail = useCallback((p: TrafficSignalProject) => {
    const params = new URLSearchParams({ dept_id: deptId })
    router.push(`/admin/traffic-signal/detail/${p.id}?${params}`)
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
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
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
