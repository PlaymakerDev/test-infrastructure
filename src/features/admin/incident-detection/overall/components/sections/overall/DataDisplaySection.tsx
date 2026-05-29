import React, { useMemo, useState } from 'react'
import { TableIncidentDetectionData, IncidentDetectionList } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import FormSearchIncidentDetection from './FormSearchIncidentDetection'

interface Props {}

const ID_FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ', statKey: 'inWarranty', colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white', badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]' },
  { key: 'expired', label: 'หมดค้ำ', colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white', badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

const ID_STATS: FilterStats = { all: 795, online: 485, offline: 310, inWarranty: 582, expired: 213 }

const DataDisplaySection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE': return <TableIncidentDetectionData />
      case 'GRID': return <IncidentDetectionList />
      default: return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <SearchBar filters={ID_FILTERS} stats={ID_STATS} activeFilter={activeFilter} onFilterChange={setActiveFilter} defaultViewMode={displayType} onViewModeChange={setDisplayType} formSearch={<FormSearchIncidentDetection />} />
      </section>
      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
