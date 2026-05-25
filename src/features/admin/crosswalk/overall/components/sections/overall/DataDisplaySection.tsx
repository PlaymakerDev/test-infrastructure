import React, { useMemo, useState } from 'react'
import {
  TableCrosswalkData,
  CrosswalkList
} from '../../../components'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchCrosswalk from './FormSearchCrosswalk'

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

const CROSSWALK_STATS: FilterStats = {
  all: 20,
  online: 8,
  offline: 12,
  inWarranty: 5,
  expired: 15,
}

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCrosswalkData />
      case 'GRID':
        return <CrosswalkList />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <SearchBar
          filters={CROSSWALK_FILTERS}
          stats={CROSSWALK_STATS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          formSearch={<FormSearchCrosswalk />}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
