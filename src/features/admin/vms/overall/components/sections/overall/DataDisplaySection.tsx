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
import { scopeKey } from '@/services/routes/scopeParam'
import type { APIResponseVMSList, ListSolution } from '@/types/vms/overview-api'


interface Props {
  deptId?: string | string[] | number
}

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

const DataDisplaySection: React.FC<Props> = (props) => {
  const { deptId } = props
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const { vms_list } = useAppSelector(state => state.vms_overview)

  // Fetch totals directly instead of reading from Redux — same query key as
  // InfoCardSection so both components share one cached response, no extra
  // request. Redux is no longer the source of truth here (per CLAUDE.md:
  // do NOT add server-fetched data to slices).
  const { data: totals } = useQuery({
    queryKey: ['vms_total', String(deptId ?? ''), scopeKey()],
    queryFn: () => getVMSOverviewTotalAPI(Number(deptId)!),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  const vmsStats = useMemo<FilterStats>(() => ({
    all: totals?.data.solution.total ?? 0,
    online: totals?.data.solution.online ?? 0,
    offline: totals?.data.solution.offline ?? 0,
    inWarranty: totals?.data.warranty.active ?? 0,
    expired: totals?.data.warranty.expired ?? 0,
  }), [totals])

  const { data, isLoading } = useQuery({
    // dept + scope in the key — previously only the search text, so switching
    // departments/entry point reused the other's cached list.
    queryKey: ['vms_list', String(deptId ?? ''), scopeKey(), vms_list.search],
    queryFn: () => getVMSOverviewListAPI(Number(deptId)!, vms_list.search),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  // Client-side filter — the API's status_name/warranty_name params don't
  // match the FilterConfig keys ('online'/'offline'/'in-warranty'/'expired'),
  // so filtering happens on the loaded response instead. Rebuilds the same
  // dept → sub_dept → solutions tree with only the matching solutions kept;
  // sub-depts / depts that end up empty are dropped so no empty headers show.
  const filteredData = useMemo<APIResponseVMSList | undefined>(() => {
    if (!data?.data) return data?.data
    if (activeFilter === 'all') return data.data
    const solutionMatches = (sol: ListSolution) => {
      switch (activeFilter) {
        case 'online': return sol.vms.status.is_online === true
        case 'offline': return sol.vms.status.is_online === false
        case 'in-warranty': return sol.warranty.is_warranty === true
        case 'expired': return sol.warranty.is_warranty === false
        default: return true
      }
    }
    return data.data
      .map((dept) => ({
        ...dept,
        sub_department: (dept.sub_department ?? [])
          .map((sub) => ({ ...sub, solutions: (sub.solutions ?? []).filter(solutionMatches) }))
          .filter((sub) => sub.solutions.length > 0),
      }))
      .filter((dept) => dept.sub_department.length > 0)
  }, [data, activeFilter])

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
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
