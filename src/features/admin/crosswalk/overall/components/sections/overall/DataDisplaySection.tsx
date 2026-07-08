"use client"
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

const OverallDataDisplaySection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  const { data, isLoading } = useCrosswalkCentralList(deptId)

  const goToDetail = useCallback(
    (p: CrosswalkProject) => {
      const params = new URLSearchParams({ dept_id: deptId })
      if (p.projectId) params.set('project_id', p.projectId)
      if (p.roadId) params.set('road_id', p.roadId)
      router.push(`/admin/crosswalk/detail/${p.id}?${params}`)
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
        />
      </section>
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
