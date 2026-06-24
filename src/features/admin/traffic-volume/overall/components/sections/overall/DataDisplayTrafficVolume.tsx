"use client"
import React, { useMemo, useState } from 'react'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTrafficVolume from './FormSearchTrafficVolume'
import TableTrafficVolume from './TableTrafficVolume'
import SummaryTableTrafficVolume from './SummaryTableTrafficVolume'
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

const DataDisplayTrafficVolume: React.FC<Props> = () => {
  const deptId = useDeptId()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

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
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableTrafficVolume projects={filtered} loading={isLoading} />
        ) : (
          <SummaryTableTrafficVolume projects={filtered} loading={isLoading} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplayTrafficVolume)
