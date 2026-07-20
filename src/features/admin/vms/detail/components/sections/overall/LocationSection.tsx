"use client"
import React, { useMemo } from 'react'
import { InfoCardSection, MapSection, VMSScreen, ActiveCamera, ChartContent } from '../../../components'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
}

const LocationSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline } = props

  // Left column: device info + weather chart stacked in ONE flex column so
  // they can never overlap (previously two separate top-left / bottom-left
  // absolute panels collided when the map wasn't tall enough). Full-height on
  // desktop with `overflow-y-auto` as a safety valve; in-flow on mobile/tablet.
  const renderLeftColumn = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_weather')) return
    return (
      <MapOverlayPanel
        position='left'
        className='space-y-4 px-10 xl:px-0 xl:absolute xl:top-4 xl:left-4 xl:bottom-4 xl:z-10 xl:w-[clamp(24rem,30vw,32rem)] xl:overflow-y-auto no-scrollbar'
      >
        <InfoCardSection data={data} />
        <ChartContent data={data} />
      </MapOverlayPanel>
    )
  }, [data])

  const renderActiveCamera = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_camera')) return
    return <ActiveCamera data={data} />
  }, [data])

  return (
    <div className='flex flex-col gap-4 xl:block xl:relative'>
      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-[75dvh]'>
        <MapSection
          data={data}
          isWarranty={isWarranty}
          isOnline={isOnline}
        />
      </div>

      {/* Left column: device info + weather chart in one non-overlapping stack */}
      {renderLeftColumn}

      {/* Right column: VMSScreen + ActiveCamera, spans full height on desktop */}
      <MapOverlayPanel
        position='right'
        className='flex flex-col gap-4 px-10 xl:px-0 xl:absolute xl:top-4 xl:right-4 xl:bottom-4 xl:z-10 xl:w-[clamp(22rem,26vw,28rem)]'
      >
        <VMSScreen
          data={data}
        />
        {renderActiveCamera}
      </MapOverlayPanel>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
