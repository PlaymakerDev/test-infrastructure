"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton } from 'antd'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import MapSectionCctv from './sections/overall/MapSectionCctv'
import StatsSectionCctv from './sections/overall/StatsSectionCctv'
import CameraListCctv from './sections/overall/CameraListCctv'
import CamerasTableCctv from './sections/overall/CamerasTableCctv'
import CardGridCctv from './sections/overall/CardGridCctv'
import FormSearchCctv from './sections/overall/FormSearchCctv'
import {
  useCctvOverviewCentralList,
  useCctvOverviewCentralTotals,
  useCctvRandomOnline,
} from '@/hooks/queries/cctv'
import type { CCTVOverviewRow } from '@/types/cctv/overview-api'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import { useScopeAll } from '@/hooks/useScopeAll'

interface Props {
  deptId?: string | null
}

const CCTV_FILTERS: FilterConfig[] = [
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

const OverallSection: React.FC<Props> = ({ deptId }) => {
  const router = useRouter()
  const scopeAll = useScopeAll()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  // Bureau-aware list — nested bureau → sub-department (แขวง) → solutions.
  // Flatten into rows tagged with their แขวง so the table can group by it
  // (like traffic-signal). No pagination — returns the whole department.
  const { data: centralData, isLoading: listLoading } = useCctvOverviewCentralList(deptId)
  const { data: totals } = useCctvOverviewCentralTotals(deptId)
  const { data: randomOnlineRes } = useCctvRandomOnline(deptId, 3)
  const randomOnline = randomOnlineRes?.data ?? []

  const allItems = useMemo<CCTVOverviewRow[]>(() => {
    const rows: CCTVOverviewRow[] = []
    for (const bureau of centralData ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          rows.push({ ...sol, bureau: sub.department_short_name })
        }
      }
    }
    return rows
  }, [centralData])

  const stats: FilterStats = useMemo(
    () => ({
      all: allItems.length,
      online: allItems.filter((i) => i.camera.online > 0).length,
      offline: allItems.filter((i) => i.camera.offline > 0).length,
      inWarranty: allItems.filter((i) => i.is_warranty).length,
      expired: allItems.filter((i) => !i.is_warranty).length,
    }),
    [allItems]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allItems.filter((item) => {
      switch (activeFilter) {
        case 'online': if (item.camera.online === 0) return false; break
        case 'offline': if (item.camera.offline === 0) return false; break
        case 'in-warranty': if (!item.is_warranty) return false; break
        case 'expired': if (item.is_warranty) return false; break
      }
      if (term) {
        const haystack = `${item.bureau} ${item.road.code_name} ${item.solution.solution_name} ${item.project.contract_no}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [allItems, activeFilter, search])

  if (listLoading) return <Skeleton active paragraph={{ rows: 8 }} />

  return (
    <div className='flex flex-col gap-5'>
      {/* ── Map + side rails — 3-column grid on desktop, stacked on mobile ── */}
      <MapFocusGrid>

        {/* LEFT — camera preview list */}
        <MapOverlayPanel
          position='left'
          className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
        >
          <CameraListCctv cameras={randomOnline} />
        </MapOverlayPanel>

        {/* CENTER — Map */}
        <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
          <MapSectionCctv deptId={deptId} edgeFade={{ all: 20 }} />
        </div>

        {/* RIGHT — search button + stats cards */}
        <MapOverlayPanel
          position='right'
          className='row-start-3 lg:row-start-1 lg:col-start-3 lg:overflow-y-auto lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
        >
          <Button
            block
            type='primary'
            size='large'
            shape='round'
            // Carry the CURRENT page's scope into the search page — arriving
            // from the nationwide view (?scope=all) must keep every bureau's
            // roads searchable; dropping it silently narrows the search to
            // the single ทช.ส่วนกลาง group (1 road / 22 cameras).
            onClick={() => {
              const q = new URLSearchParams()
              if (deptId) q.set('dept_id', deptId)
              if (scopeAll) q.set('scope', 'all')
              const qs = q.toString()
              router.push(`/admin/cctv/search${qs ? `?${qs}` : ''}`)
            }}
          >
            ค้นหากล้อง CCTV รายสายทาง
          </Button>
          <StatsSectionCctv totals={totals ?? null} />
        </MapOverlayPanel>
      </MapFocusGrid>

      {/* ── Filter bar ── */}
      <section>
        <SearchBar
          filters={CCTV_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchCctv onSearchChange={setSearch} />}
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>

      {/* ── Table / Card grid ── */}
      <section>
        {viewMode === 'TABLE' ? (
          <CamerasTableCctv items={filtered} loading={listLoading} />
        ) : (
          <CardGridCctv items={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
