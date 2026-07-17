"use client"
import React from 'react'
import { Col, Row } from 'antd'
import {
  MapDetailTrafficSignal,
  InfoCardsTrafficSignal,
  TrafficCycleTrafficSignal,
  PhaseTimingTrafficSignal,
  CamerasGridTrafficSignal,
  ChartTrafficVolumeTrafficSignal,
  ChartETAnalysisTrafficSignal,
  ChartRealtimePerformanceTrafficSignal,
} from '../components'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props { }

const OverallSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      {/* ── Map background + overlays.
        * Layout per Figma:
        *  • Map = full-width background.
        *  • Traffic Cycle donut overlaid at the bottom-right of the map.
        *  • Right rail (4 info cards + Phase Timing pinned bottom via mt-auto)
        *    absolute-positioned on top of the map on desktop, in-flow on mobile. */}
      <section className='flex flex-col gap-4 xl:block xl:relative'>
        {/* Map: full-width background, defines container height on desktop */}
        <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-180'>
          <MapDetailTrafficSignal edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }} />

          {/* Cycle overlay — same height as Phase Timing (h-71) and bottom-3.
            * `right-96` (24rem = 384px) clears the right rail below
            * (`right-4` + `w-90` = 16 + 360 = 376px) with an 8px gap. */}
          <MapOverlayPanel
            position='bottom'
            className='hidden xl:block absolute bottom-2 right-96 w-115 xl:h-71 pointer-events-auto'
          >
            <TrafficCycleTrafficSignal />
          </MapOverlayPanel>
        </div>

        {/* Right rail — `gap-3` between every card. On desktop, absolute-positioned
          * on top of the map. `xl:bottom-3` matches the Cycle overlay's `bottom-3`
          * so Phase Timing's bottom edge aligns with the Cycle overlay's bottom. */}
        <MapOverlayPanel
          position='right'
          className='flex flex-col gap-3 px-10 xl:px-0 xl:absolute xl:top-4 xl:right-4 xl:bottom-3 xl:z-10 xl:w-90'
        >
          <InfoCardsTrafficSignal />
          {/* `mt-auto` pins Phase Timing to the bottom. `shrink-0` guards against
            * flex shrinkage when InfoCards is tall, so h-71 (284px) is always
            * honored — matching the Cycle overlay's h-71 exactly. */}
          <div className='xl:h-71 xl:mt-auto xl:shrink-0'>
            <PhaseTimingTrafficSignal />
          </div>
        </MapOverlayPanel>
      </section>

      {/* ── Mobile/tablet fallback for the Cycle card (xl+ shows it as a map
        * overlay). Phase Timing already stacks naturally in the right column
        * when the grid collapses on small screens. */}
      <section className='xl:hidden'>
        <TrafficCycleTrafficSignal />
      </section>

      {/* ── Cameras grid (filter + view toggle + 4 Counting + 4 Stopline) ── */}
      <section>
        <CamerasGridTrafficSignal />
      </section>

      {/* ── 3 charts row: Traffic volume / ET analysis / Real-time perf ── */}
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <ChartTrafficVolumeTrafficSignal />
          </Col>
          <Col xs={24} lg={8}>
            <ChartETAnalysisTrafficSignal />
          </Col>
          <Col xs={24} lg={8}>
            <ChartRealtimePerformanceTrafficSignal />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
