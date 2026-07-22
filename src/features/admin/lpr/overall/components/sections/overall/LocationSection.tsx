"use client"
import React from 'react'
import { CCTVSection, InfoCardSection, MapSection } from '../../../components'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  deptId?: string | string[] | number
}

const LocationSection: React.FC<Props> = (props) => {
  const { deptId } = props
  return (
    <MapFocusGrid>
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:overflow-y-auto lg:h-full flex flex-col gap-4'
      >
        <CCTVSection deptId={deptId!} />
      </MapOverlayPanel>
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapSection deptId={deptId!} />
      </div>
      {/* Right rail mirrors incident-detection's: no overflow-y-auto — the
        * antd-Row negative margins used to poke past the panel edge and spawn
        * a horizontal scrollbar under the KPI cards (2026-07-20). */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:h-full min-h-0 flex flex-col'
      >
        <InfoCardSection deptId={deptId!} />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo<Props>(LocationSection)
