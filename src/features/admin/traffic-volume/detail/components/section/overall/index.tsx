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
      {/* `xl:items-start` — each column hugs its own content height instead of
        * stretching to the tallest sibling (the breakdown table). The chart
        * cards now render at a fixed inner height (`fillHeight` was capped to a
        * clamp height globally, so a stretched card no longer grows the plot to
        * fill it), so stretching them only produced dead space below the chart. */}
      {/* `minmax(0,…)` on every track — a bare `1fr` track is `minmax(auto,1fr)`,
        * whose minimum is the content's min-width. The SVG-rendered ECharts grow
        * their intrinsic width on browser zoom, which raises that minimum; on
        * zoom-back the track then refuses to shrink and the chart stays stretched.
        * Pinning the min to 0 lets the tracks (and the charts) shrink back.
        *
        * Columns use grid's default `stretch` so the pie + table cards get a
        * genuinely DEFINITE height (= the row track) — that's what lets their
        * inner flex chains actually fill (a `h-full` percentage under
        * `items-start` stays indefinite and won't drive the fill). */}
      <section className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4'>
        {/* Left column — the two fixed-height charts define the row's height, so
          * this column is the tallest. `xl:self-start` opts it OUT of stretch:
          * stretching it would resolve the LineChart card's own `h-full` against
          * a taller box and overflow the stack. `min-w-0` lets it shrink below
          * the charts' intrinsic SVG width (zoom-resize fix above). */}
        <div className='flex flex-col gap-4 min-w-0 xl:self-start'>
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
