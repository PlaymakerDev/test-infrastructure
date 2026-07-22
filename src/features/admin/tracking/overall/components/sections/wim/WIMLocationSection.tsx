"use client"
import React from 'react'
import { WIMCCTVList, WIMMap, WIMSearchPanel } from '@/features/admin/tracking/overall/components'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  onSearch?: (value: string) => void
  searchText?: string
}

/** Uses the shared MapFocusGrid / MapOverlayPanel pair so the navbar's
 *  เน้นแผนที่ toggle works on this tab (2026-07-22). */
const WIMLocationSection: React.FC<Props> = (props) => {
  const { onSearch, searchText } = props

  return (
    <MapFocusGrid
      className='grid grid-cols-1 gap-4 lg:h-[85dvh]'
      desktopCols='340px minmax(0, 1fr) 340px'
    >

      {/* Camera list — hidden on mobile, col 1 on desktop. Always exactly 3 items
          sized via flex-1 to fill the column, so no scroll affordance is needed
          — an overflow-y-auto here only ever fired from flexbox's own sub-pixel
          rounding, showing a spurious scrollbar. */}
      <MapOverlayPanel position='left' className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:h-full min-h-0 lg:overflow-hidden'>
        <WIMCCTVList />
      </MapOverlayPanel>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <WIMMap searchText={searchText} />
      </div>

      {/* Search / stats panel — row 3 on mobile, col 3 on desktop */}
      <MapOverlayPanel position='right' className='row-start-3 lg:col-start-3 lg:row-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4 lg:pl-1'>
        <WIMSearchPanel
          onSearch={onSearch}
        />
      </MapOverlayPanel>

    </MapFocusGrid>
  )
}

export default React.memo(WIMLocationSection)
