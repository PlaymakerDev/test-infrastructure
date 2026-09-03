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
  // absolute panels collided when the map wasn't tall enough). Natural,
  // content-driven height — never capped, never internally scrolled (a capped
  // + scrolled revision was rejected 2026-09-02: "layout อันเก่าแบบเดิมถูกแล้ว").
  //
  // IN NORMAL FLOW on xl (not absolute) — see the flex wrapper in the JSX:
  // BOTH columns sit in flow so whichever is taller gives the map block its
  // height, and whatever renders after the block (the PM charts row) can
  // never collide with either. (First fix only put THIS column in flow with
  // the right panel still bottom-anchored — a no-weather sign then had no
  // left column, the block collapsed to 75dvh and the right column's videos
  // overflowed onto the charts row; caught on solution 2877, 2026-09-03.)
  //
  // Per design reference: the chart card is noticeably WIDER than the info
  // cards above it (not confined to the same narrow overlay column) — so
  // width lives on each child individually rather than on the shared
  // MapOverlayPanel, which stays width-less (xl:w-fit keeps the flow panel
  // from blocking map clicks to its right) and just shrink-wraps to its
  // widest child (the chart).
  const renderLeftColumn = useMemo(() => {
    if (!Object.keys(data || {}).includes('vms_weather')) return
    return (
      <MapOverlayPanel
        position='left'
        className='space-y-4 px-10 xl:px-0 xl:w-fit'
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
    <div className='flex flex-col gap-4 xl:block xl:relative xl:min-h-[75dvh]'>
      {/* Map: mobile = fixed-height block in the stack; xl = absolute inset-0
        * BACKGROUND of the whole block. Block height = the columns' flow
        * height (min 75dvh), so the map stretches to sit behind however tall
        * they run and content below the block never collides with them. */}
      <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-auto xl:absolute xl:inset-0'>
        <MapSection
          data={data}
          isWarranty={isWarranty}
          isOnline={isOnline}
        />
      </div>

      {/* Both overlay columns share one FLOW wrapper on xl (mobile:
        * display:contents keeps them as direct children of the outer
        * flex-col, same stacking as before). The wrapper — not the columns —
        * carries the 16px inset, and is pointer-events-none so the empty band
        * between the columns still pans/zooms the map; each MapOverlayPanel
        * re-enables its own pointer events via motion's inline style.
        * `figure-normal` video heights are viewport-based (custom.css), so
        * the right column no longer needs its old top/bottom anchoring — the
        * flex-1/min-h-0 sizing that once required a definite-height ancestor
        * is long gone from VMSScreen/ActiveCamera. */}
      <div className='contents xl:flex xl:items-start xl:gap-4 xl:relative xl:z-10 xl:p-4 xl:pointer-events-none'>
        {/* Left column: device info + weather chart in one non-overlapping stack */}
        {renderLeftColumn}

        {/* Right column: VMSScreen + ActiveCamera, pinned to the row's end. */}
        <MapOverlayPanel
          position='right'
          className='flex flex-col gap-4 px-10 xl:px-0 xl:ml-auto xl:shrink-0 xl:w-[clamp(22rem,26vw,28rem)]'
        >
          <VMSScreen
            data={data}
          />
          {renderActiveCamera}
        </MapOverlayPanel>
      </div>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
