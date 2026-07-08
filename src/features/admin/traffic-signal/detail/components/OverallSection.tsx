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

interface Props { }

const OverallSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      {/* ── Map area + right rail.
        * Layout per Figma:
        *  • Left column = 3D map. Traffic Cycle donut is overlaid at the
        *    bottom-right of the map (fixed width, not spanning full width).
        *  • Right column = 4 info cards at top + Phase Timing pinned to the
        *    bottom (mt-auto), so it visually aligns with the Cycle overlay. */}
      <section className='grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 xl:h-180'>
        <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-full'>
          <MapDetailTrafficSignal edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }} />

          {/* Cycle overlay — same height as Phase Timing (h-71) and bottom-3
            * to mirror the right column's bottom padding. */}
          <div className='hidden xl:block absolute bottom-3 right-3 w-115 xl:h-71 pointer-events-auto'>
            <TrafficCycleTrafficSignal />
          </div>
        </div>

        {/* Right column — `gap-3` between every card and `pb-3` at the bottom
          * so the spacing matches the Cycle overlay's `bottom-3` offset.
          * Phase Timing pinned to h-71 to align with the Cycle overlay. */}
        <div className='flex flex-col gap-3 xl:h-full xl:pb-3'>
          <InfoCardsTrafficSignal />
          {/* `mt-auto` pins Phase Timing to the bottom so its top/bottom line up
            * with the Traffic Signal Cycle overlay on the left (both h-71). */}
          <div className='xl:h-71 xl:mt-auto'>
            <PhaseTimingTrafficSignal />
          </div>
        </div>
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
