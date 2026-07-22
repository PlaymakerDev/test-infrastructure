"use client"
import React from 'react'
import {
  MobileMap,
  MobileSearchPanel,
  MobileStationData
} from '@/features/admin/tracking/overall/components'
import { MobileMasterData } from '@/types/tracking/overall-api'
import { WIMMetaData } from '@/types/shared'
import { APIResponseTrackingViewSumPlanChart } from '@/types/tracking/overall-api'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
  sumPlanData?: APIResponseTrackingViewSumPlanChart
  isSumPlanLoading?: boolean
  isSumPlanError?: boolean
}

/** Uses the shared MapFocusGrid / MapOverlayPanel pair so the navbar's
 *  เน้นแผนที่ toggle works on this tab (2026-07-22). */
const MobileLocationSection: React.FC<Props> = (props) => {
  const { data, meta, isLoading, isError, sumPlanData, isSumPlanLoading, isSumPlanError } = props
  return (
    <MapFocusGrid
      className='grid grid-cols-1 gap-4 lg:h-[85dvh]'
      desktopCols='340px minmax(0, 1fr) 340px'
    >

      {/* Station data — hidden on mobile, col 1 on desktop. Always a capped
          (2-item) list sized via flex-1 to fill the column, so no scroll
          affordance is needed — an overflow-y-auto here only ever fired from
          flexbox's own sub-pixel rounding, showing a spurious scrollbar. */}
      <MapOverlayPanel position='left' className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:h-full min-h-0 lg:overflow-hidden'>
        <MobileStationData />
      </MapOverlayPanel>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MobileMap />
      </div>

      {/* Search / stats panel — row 3 on mobile, col 3 on desktop */}
      <MapOverlayPanel position='right' className='row-start-3 lg:col-start-3 lg:row-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4 lg:pl-1'>
        <MobileSearchPanel
          data={data || []}
          meta={meta}
          isLoading={isLoading}
          isError={isError}
          sumPlanData={sumPlanData}
          isSumPlanLoading={isSumPlanLoading}
          isSumPlanError={isSumPlanError}
        />
      </MapOverlayPanel>

    </MapFocusGrid>
  )
}

export default React.memo(MobileLocationSection)
