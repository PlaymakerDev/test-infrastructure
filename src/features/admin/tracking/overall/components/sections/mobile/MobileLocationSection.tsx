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

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
  sumPlanData?: APIResponseTrackingViewSumPlanChart
  isSumPlanLoading?: boolean
  isSumPlanError?: boolean
}

const MobileLocationSection: React.FC<Props> = (props) => {
  const { data, meta, isLoading, isError, sumPlanData, isSumPlanLoading, isSumPlanError } = props
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[340px_1fr_340px] gap-4 lg:h-[85dvh]'>

      {/* Station data — hidden on mobile, col 1 on desktop. Always a capped
          (2-item) list sized via flex-1 to fill the column, so no scroll
          affordance is needed — an overflow-y-auto here only ever fired from
          flexbox's own sub-pixel rounding, showing a spurious scrollbar. */}
      <div className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:h-full'>
        <MobileStationData />
      </div>

      {/* Map — row 1 on mobile (top), col 2 on desktop */}
      <div className='row-start-1 lg:col-start-2 lg:row-start-1 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MobileMap />
      </div>

      {/* Search / stats panel — row 3 on mobile, col 3 on desktop */}
      <div className='row-start-3 lg:col-start-3 lg:row-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4 lg:pl-1'>
        <MobileSearchPanel
          data={data || []}
          meta={meta}
          isLoading={isLoading}
          isError={isError}
          sumPlanData={sumPlanData}
          isSumPlanLoading={isSumPlanLoading}
          isSumPlanError={isSumPlanError}
        />
      </div>

    </div>
  )
}

export default React.memo(MobileLocationSection)
