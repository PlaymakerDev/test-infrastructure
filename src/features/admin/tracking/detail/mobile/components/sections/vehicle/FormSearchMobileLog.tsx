import React from 'react'
import SearchBar, { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import { MOBILE_WEIGHT_FILTERS, MobileWeightFilter } from '@/features/admin/tracking/detail/mobile/data/mobileWeightFilters'

interface Props {
  activeFilter: MobileWeightFilter
  onFilterChange: (filter: MobileWeightFilter) => void
  stats: FilterStats
  displayType: ViewMode
  onDisplayTypeChange: (mode: ViewMode) => void
}

const FormSearchMobileLog: React.FC<Props> = (props) => {
  const { activeFilter, onFilterChange, stats, displayType, onDisplayTypeChange } = props

  return (
    <SearchBar
      filters={MOBILE_WEIGHT_FILTERS}
      stats={stats}
      activeFilter={activeFilter}
      onFilterChange={(key) => onFilterChange(key as MobileWeightFilter)}
      defaultViewMode={displayType}
      onViewModeChange={onDisplayTypeChange}
    />
  )
}

export default React.memo<Props>(FormSearchMobileLog)
