"use client"
import React, { useCallback, useMemo, useState } from 'react'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTunnel from './FormSearchTunnel'
import TableTunnelData from './TableTunnelData'
import ModalTunnelViewer, {
  type TunnelViewerTarget,
} from './ModalTunnelViewer'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import { useTunnelCentralList } from '@/hooks/queries/tunnel'
import { useDeptId } from '@/hooks/useDeptId'
import type { TunnelProject } from '@/features/admin/tunnel/overall/data/tunnel'
import type { TunnelCentralSolution } from '@/types/tunnel/overview-api'

interface Props { }

const TUNNEL_FILTERS: FilterConfig[] = [
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

/** Adapter: `/overview/central/list` solution row → UI `TunnelProject`.
 *  Bureau is filled by the caller because it lives one level up in the
 *  nested response. Connection status comes from `tunnel.is_online` (the
 *  อุโมงค์ device health), NOT from the camera's online state.
 *
 *  The endpoint returns `tunnel.camera_count` / `tunnel.lighting_count`;
 *  per-camera online/offline breakdowns are not part of this contract, so
 *  the UI's `onlineCount` / `offlineCount` are left as 0. */
const apiSolutionToProject = (
  item: TunnelCentralSolution,
  bureau: string,
): TunnelProject => {
  const solution = item?.solution
  const project = item?.project
  const road = item?.road
  const tunnel = item?.tunnel
  return {
    id: solution?.id != null ? String(solution.id) : '',
    projectId: project?.id != null ? String(project.id) : undefined,
    roadId: road?.id != null ? String(road.id) : undefined,
    roadCode: road?.code_name ?? '',
    projectName: project?.project_name,
    installPoint: solution?.solution_name ?? '',
    contractNo: project?.contract_no ?? '',
    budgetYear: project?.budget_year,
    warranty: item?.is_warranty ? 'in-warranty' : 'expired',
    connection: tunnel?.is_online ? 'online' : 'offline',
    bureau,
    totalCameras: tunnel?.camera_count ?? 0,
    onlineCount: 0,
    offlineCount: 0,
    totalLighting: tunnel?.lighting_count ?? 0,
    tunnelUrl: item?.tunnel_url,
  }
}


const OverallDataDisplaySection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  // Modal state is local — the viewer is only ever shown from this section,
  // so hoisting to Context would add noise without any real reuse.
  const [viewerTarget, setViewerTarget] = useState<TunnelViewerTarget | null>(
    null,
  )

  const { data, isLoading } = useTunnelCentralList(deptId)

  const handleOpenTunnel = useCallback((p: TunnelProject) => {
    if (!p.tunnelUrl) return
    setViewerTarget({
      url: p.tunnelUrl,
      title: p.installPoint || p.projectName || p.roadCode || '-',
      subtitle: p.roadCode,
    })
  }, [])

  const handleCloseViewer = useCallback(() => setViewerTarget(null), [])

  // Flatten bureau → sub-dept → solutions, tagging each row with its
  // sub-dept short name so the table groups by bureau out of the box.
  // Defensive across every level — guard against partial responses.
  const projects: TunnelProject[] = useMemo(() => {
    const out: TunnelProject[] = []
    const rootList = Array.isArray(data) ? data : []
    for (const bureau of rootList) {
      const subDepts = Array.isArray(bureau?.sub_department) ? bureau.sub_department : []
      for (const subDept of subDepts) {
        const sols = Array.isArray(subDept?.solutions) ? subDept.solutions : []
        for (const sol of sols) {
          if (!sol) continue
          out.push(apiSolutionToProject(sol, subDept.department_short_name ?? ''))
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
        onDetail: () => handleOpenTunnel(p),
      })),
    [filtered, handleOpenTunnel],
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={TUNNEL_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchTunnel onSearchChange={setSearch} />}
        />
      </section>
      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableTunnelData
            projects={filtered}
            loading={isLoading}
            onOpenTunnel={handleOpenTunnel}
          />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='กล้องทั้งหมด' />
        )}
      </section>

      <ModalTunnelViewer
        open={viewerTarget !== null}
        target={viewerTarget}
        onClose={handleCloseViewer}
      />
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
