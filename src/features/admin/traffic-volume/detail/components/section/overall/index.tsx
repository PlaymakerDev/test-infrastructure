"use client"
import React from 'react'
import MapDetailTrafficVolume from './MapDetailTrafficVolume'
import InfoCardsTrafficVolume from './InfoCardsTrafficVolume'
import LineChartHour from './LineChartHour'
import BarChart7day from './BarChart7day'
import PieChartProportion from './PieChartProportion'
import VehicleBreakdownTable from './VehicleBreakdownTable'
import CamerasGridTrafficVolume from './CamerasGridTrafficVolume'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props {}

/** Tab content for "ภาพรวม". */
const OverallTrafficVolume: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      {/* ── Map background + Info cards overlay ──────────────────────────── */}
      <section className='flex flex-col gap-4 xl:block xl:relative'>
        {/* Map: full-width background, defines container height on desktop */}
        <div className='relative rounded-lg overflow-hidden h-[50dvh] xl:h-180'>
          <MapDetailTrafficVolume
            edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
          />
        </div>
        {/* Info cards: in flow on mobile, anchored top-right on desktop */}
        <MapOverlayPanel
          position='right'
          className='px-10 xl:px-0 xl:absolute xl:top-4 xl:right-4 xl:bottom-4 xl:z-10 xl:w-90'
        >
          <InfoCardsTrafficVolume />
        </MapOverlayPanel>
      </section>

      {/* ── Charts + breakdown row ────────────────────────────────────────────
        * Layout per design:
        *  • LEFT  — Hourly line chart stacked over the 7-day bar chart.
        *  • MID   — Vehicle proportion donut with legend list below.
        *  • RIGHT — Per-type breakdown table.
        * On narrow viewports each item stacks vertically. */}
      <section className='grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.2fr] gap-4 xl:auto-rows-fr'>
        {/* Left column — `grid-rows-2` with `1fr 1fr` forces the line + bar
          * cards to split the column height exactly so they never look like
          * "one big, one small". */}
        <div className='grid grid-rows-2 gap-4 min-h-0'>
          <LineChartHour />
          <BarChart7day />
        </div>
        <PieChartProportion />
        <VehicleBreakdownTable />
      </section>

      {/* ── CCTV grid (filter pills + 3-col camera tiles) ─────────────────── */}
      <section>
        <CamerasGridTrafficVolume />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallTrafficVolume)
