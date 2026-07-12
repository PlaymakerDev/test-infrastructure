import React from 'react'
import SearchBar, { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import { WEIGHT_FILTERS, WeightFilter } from '@/features/admin/tracking/detail/wim/data/weightFilters'

interface Props {
  activeFilter: WeightFilter
  onFilterChange: (filter: WeightFilter) => void
  stats: FilterStats
  displayType: ViewMode
  onDisplayTypeChange: (mode: ViewMode) => void
}

const FormSearchWeightLog: React.FC<Props> = (props) => {
  const { activeFilter, onFilterChange, stats, displayType, onDisplayTypeChange } = props

  return (
    <SearchBar
      filters={WEIGHT_FILTERS}
      stats={stats}
      activeFilter={activeFilter}
      onFilterChange={(key) => onFilterChange(key as WeightFilter)}
      defaultViewMode={displayType}
      onViewModeChange={onDisplayTypeChange}
    />
  )
}

export default React.memo<Props>(FormSearchWeightLog)
