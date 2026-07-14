"use client"
import React, { useMemo, useState } from 'react'
import {
  TableCameraData,
  CameraList
} from '../../../components'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'

interface Props {

}

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
]

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [displayType, setDisplayType] = useState<ViewMode>('GRID')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // React Query dedupes with the same call inside TableCameraData/CameraList
  // — one network request, shared cache.
  const { data } = useCrosswalkCameras(deptId, { solution_id: id })

  const stats = useMemo<FilterStats>(() => {
    const cameras = data?.cameras ?? []
    const online = cameras.filter((c) => c.is_online).length
    return {
      all: cameras.length,
      online,
      offline: cameras.length - online,
    }
  }, [data])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCameraData activeFilter={activeFilter} />
      case 'GRID':
        return <CameraList activeFilter={activeFilter} />
      default:
        return null
    }
  }, [displayType, activeFilter])

  return (
    <div>
      <section>
        <SearchBar
          filters={CROSSWALK_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
