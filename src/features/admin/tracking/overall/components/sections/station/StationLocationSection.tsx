"use client"
import React from 'react'
import { StationCCTVList, StationMap, StationSearchPanel } from '@/features/admin/tracking/overall/components'

interface Props {
  onSearch?: (value: string) => void
  searchText?: string
}

const StationLocationSection: React.FC<Props> = (props) => {
  const { onSearch, searchText } = props

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[340px_1fr_340px] gap-4 lg:h-[85dvh]'>

      {/* Camera list — hidden on mobile, col 1 on desktop. Always exactly 3 items
          sized via flex-1 to fill the column, so no scroll affordance is needed
          — an overflow-y-auto here only ever fired from flexbox's own sub-pixel
          rounding, showing a spurious scrollbar. */}
      <div className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:h-full'>
        <StationCCTVList />
      </div>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <StationMap searchText={searchText} />
      </div>

      {/* Search / stats panel — row 3 on mobile, col 3 on desktop */}
      <div className='row-start-3 lg:col-start-3 lg:row-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4 lg:pl-1'>
        <StationSearchPanel
          onSearch={onSearch}
        />
      </div>

    </div>
  )
}

export default React.memo(StationLocationSection)
