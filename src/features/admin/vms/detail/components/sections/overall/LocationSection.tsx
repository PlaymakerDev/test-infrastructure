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
  // absolute panels collided when the map wasn't tall enough). Anchored at
  // top-4 only (not stretched to bottom-4) — its content (info cards + a
  // fixed-height chart) doesn't benefit from being force-stretched to fill
  // the map's height the way bridge-lighting's ECharts-based charts do, it
  // would just leave dead space. Natural height instead, so if it runs
  // taller than the map, the page scrolls to reveal the rest — no more
  // hidden `overflow-y-auto no-scrollbar` internal scroll pane.
  //
  // Per design reference: the chart card is noticeably WIDER than the info
  // cards above it (not confined to the same narrow overlay column) — so
  // width lives on each child individually rather than on the shared
  // MapOverlayPanel, which stays width-less and just shrink-wraps to its
  // widest child (the chart).
  const renderLeftColumn = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_weather')) return
    return (
      <MapOverlayPanel
        position='left'
        className='space-y-4 px-10 xl:px-0 xl:absolute xl:top-4 xl:left-4 xl:z-10'
      >
        <div className='xl:w-[clamp(24rem,30vw,32rem)]'>
          <InfoCardSection data={data} />
        </div>
        <div className='xl:w-[clamp(28rem,43vw,50rem)]'>
          <ChartContent data={data} />
        </div>
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

      {/* Right column: VMSScreen + ActiveCamera. Kept stretched top-4..bottom-4
        * (unlike the left column) — its `flex-1 min-h-0` video figures need a
        * definite-height ancestor to size sensibly; without one, flexbox's
        * intrinsic-sizing fallback degrades unpredictably (verified live: one
        * figure settled around a reasonable height, a sibling figure in the
        * same chain collapsed to ~24px). Natural-height only works for content
        * that doesn't rely on flex-grow to fill space (see the left column). */}
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
