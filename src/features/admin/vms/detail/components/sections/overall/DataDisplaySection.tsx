import React, { useMemo, useState } from 'react'
import { TableCameraData, CameraList } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'

interface Props {}

const FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

const STATS: FilterStats = { all: 4, online: 4, offline: 0 }

const DataDisplaySection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE': return <TableCameraData />
      case 'GRID': return <CameraList />
      default: return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <SearchBar filters={FILTERS} stats={STATS} activeFilter={activeFilter} onFilterChange={setActiveFilter} defaultViewMode={displayType} onViewModeChange={setDisplayType} />
      </section>
      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
