"use client"
import React from 'react'
import {
  MobileMap,
  MobileSearchPanel,
  MobileStationData
} from '@/features/admin/tracking/overall/components'
import { MobileMasterData } from '@/types/tracking/overall-api'
import { WIMMetaData } from '@/types/shared'

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
}

const MobileLocationSection: React.FC<Props> = (props) => {
  const { data, meta, isLoading, isError } = props
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 lg:h-[75dvh]'>

      {/* Station data — hidden on mobile, col 1 on desktop */}
      <div className='flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:overflow-y-auto lg:h-full lg:pr-1'>
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
        />
      </div>

    </div>
  )
}

export default React.memo(MobileLocationSection)
