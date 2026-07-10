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

  const renderInfoCardSection = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_weather')) return
    return (
      <MapOverlayPanel
        position='left'
        className='px-10 lg:px-0 lg:absolute lg:top-0 lg:left-4 lg:z-10 lg:w-[clamp(26rem,28vw,48rem)]'
      >
        <InfoCardSection data={data} />
      </MapOverlayPanel>
    )
  }, [data])

  const renderWeatherChart = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_weather')) return
    return (
      <MapOverlayPanel
        position='left'
        className='px-10 lg:px-0 lg:absolute lg:-bottom-6 lg:left-4 lg:z-10 lg:w-[clamp(32rem,45vw,52rem)]'
      >
        <ChartContent data={data} />
      </MapOverlayPanel>
    )
  }, [data])

  const renderActiveCamera = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_camera')) return
    return <ActiveCamera data={data} />
  }, [data])

  return (
    <div className='flex flex-col gap-4 lg:block lg:relative'>
      {/* Map: full-width background, defines container height on desktop */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-[75dvh]'>
        <MapSection
          data={data}
          isWarranty={isWarranty}
          isOnline={isOnline}
        />
      </div>

      {/* InfoCardSection: in flow on mobile, anchored top-left on desktop */}
      {renderInfoCardSection}

      {/* WeatherChart: in flow on mobile, anchored bottom-left on desktop */}
      {renderWeatherChart}

      {/* Right column: VMSScreen + ActiveCamera, spans full height on desktop */}
      <MapOverlayPanel
        position='right'
        className='flex flex-col gap-4 px-10 lg:px-0 lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:z-10 lg:w-[clamp(26rem,28vw,48rem)]'
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
