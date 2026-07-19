import SearchBar, { FilterConfig, FilterStats } from '@/components/searchable/SearchBar'
import React from 'react'

export type CameraFilter = 'all' | 'online' | 'offline'

interface Props {
  activeFilter: CameraFilter
  onFilterChange: (filter: CameraFilter) => void
  stats: FilterStats
}

const CAMERA_FILTERS: FilterConfig[] = [
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

const FormSearchCCTV: React.FC<Props> = (props) => {
  const { activeFilter, onFilterChange, stats } = props

  return (
    <div>
      <SearchBar
        filters={CAMERA_FILTERS}
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={(key) => onFilterChange(key as CameraFilter)}
        mode='form'
        onExport={() => alert('TODO: นำออกเอกสาร')}
        hasSwitch={false}
      />
    </div>
  )
}

export default React.memo<Props>(FormSearchCCTV)
