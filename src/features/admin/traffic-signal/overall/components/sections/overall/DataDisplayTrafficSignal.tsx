"use client"
import React, { useMemo, useState } from 'react'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTrafficSignal from './FormSearchTrafficSignal'
import TableTrafficSignal from './TableTrafficSignal'
import SummaryTableTrafficSignal from './SummaryTableTrafficSignal'
import { useTrafficList } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import type {
  TrafficSignalProject,
  SignalPhase,
  OperatingMode,
} from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import type { TrafficOverviewListItem } from '@/types/traffic-signal/overview-api'

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

/** Adapter: map an API list row to the UI's TrafficSignalProject shape.
 *  Fields not present in the list endpoint use placeholders so the existing
 *  tables render without breaking. Replace placeholders with real data once
 *  backend exposes them (or wire up secondary endpoints). */
const apiItemToProject = (item: TrafficOverviewListItem): TrafficSignalProject => ({
  // `solution.id` is the canonical solution_id — same value `/traffic/details/{id}`
  // and the rest of the solution-scoped detail endpoints expect. `project.id`
  // is the contract-level id (different entity) used by `/manage/contract/`.
  id: String(item.solution.id),
  roadCode: item.road.code_name,
  // Backend list doesn't expose project_name/install_point separately.
  // Use solution_name as the closest match for both display fields.
  projectName: item.solution.solution_name,
  installPoint: item.solution.solution_name,
  contractNo: item.project.contract_no,
  warranty: item.is_warranty ? 'in-warranty' : 'expired',
  connection: item.traffic.is_online ? 'online' : 'offline',
  stream: item.traffic.is_online,
  phase: (item.traffic.total_phases === 3 ? 3 : 4) as SignalPhase,
  operatingMode: item.traffic.controller_mode as OperatingMode,
  // Bureau grouping not in API — use a sentinel so the table renders without
  // exploding into N empty groups. Future: pull from contract endpoint.
  bureau: '-',
  coord: [0, 0],
  // Camera counts not in list endpoint — show PCU as placeholder.
  totalCameras: item.traffic.total_pcu,
  onlineCameras: item.traffic.is_online ? item.traffic.total_pcu : 0,
  offlineCameras: item.traffic.is_online ? 0 : item.traffic.total_pcu,
})

const DataDisplayTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  // Fetch all (large limit) so we can filter/search client-side without
  // round-trips per filter chip. Backend pagination kicks in for very large
  // departments — adjust limit when that becomes a concern.
  const { data } = useTrafficList(deptId, { page: 1, limit: 100 })

  // Map API items → UI shape once per fetch.
  const projects: TrafficSignalProject[] = useMemo(
    () => (data?.res_data ?? []).map(apiItemToProject),
    [data]
  )

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
          <SummaryTableTrafficSignal projects={filtered} />
        ) : (
          <TableTrafficSignal projects={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplayTrafficSignal)
