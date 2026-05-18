"use client"
import React from 'react'
import BridgeLocationMap from './sections/overall/BridgeLocationMap'
import ElectricalStatsSection from './sections/overall/ElectricalStatsSection'
import ElectricalChartsSection from './sections/overall/ElectricalChartsSection'
import BridgeStatusCard from './sections/overall/BridgeStatusCard'
import RemoteControlCard from './sections/overall/RemoteControlCard'
import MadrixControlPanel from '@/features/admin/bridge-lighting/overall/components/sections/overall/MadrixControlPanel'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  bridge: BridgeProject
}

/** Detail page main section.
 *
 *  Layout strategy:
 *  • Mobile / tablet (< xl, 1280px): everything stacks vertically — map is a
 *    fixed-height block at the top, then the cards flow below it in normal
 *    document order. Content order: stats → charts → status+remote → MADRIX.
 *  • Desktop (xl+): map becomes an absolute full-bleed background, and the
 *    cards form a 3-column overlay grid (LEFT status+remote, CENTER MADRIX,
 *    RIGHT stats+charts) with empty space passing clicks through to the map. */
const OverallSection: React.FC<Props> = ({ bridge }) => {
  return (
    <section className='relative -mx-10 overflow-x-hidden xl:overflow-hidden'>
      {/* MAP — normal flow on mobile (fixed height), absolute bg on xl+.
        * `relative` is required so the underlying BaseMap's `position: absolute`
        * is contained here on mobile (where the wrapper has a fixed height).
        * Without it the map escapes up to the section element and covers the
        * stacked cards below. */}
      <div className='relative h-70 sm:h-90 xl:absolute xl:inset-0 xl:h-auto'>
        <BridgeLocationMap bridge={bridge} />
      </div>

      {/* ── Content — 1 column on mobile, 3 columns on xl+.
        * On xl+ this overlays the map; pointer-events-none on the grid +
        * pointer-events-auto on each card lets clicks fall through empty
        * space to the Mapbox map underneath. */}
      <div className='relative grid grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_minmax(360px,1.8fr)_minmax(380px,1.6fr)] gap-3 px-10 py-5 xl:pointer-events-none'>

        {/* RIGHT (mobile order 1) — stats + charts */}
        <aside className='flex flex-col gap-3 min-w-0 order-1 xl:order-3'>
          <div className='pointer-events-auto min-w-0'>
            <ElectricalStatsSection bridge={bridge} />
          </div>
          <div className='pointer-events-auto flex-1 flex flex-col min-w-0'>
            <ElectricalChartsSection />
          </div>
        </aside>

        {/* LEFT (mobile order 2) — status + remote, bottom-anchored at xl+ */}
        <aside className='flex flex-col min-w-0 order-2 xl:order-1 xl:justify-end'>
          <div
            className='flex flex-col gap-4 p-4 pointer-events-auto min-w-0'
            style={{
              borderRadius: 20,
              background: '#191919CC',
              backdropFilter: 'blur(5px)',
            }}
          >
            <BridgeStatusCard bridge={bridge} />
            <RemoteControlCard />
          </div>
        </aside>

        {/* CENTER (mobile order 3) — MADRIX panel */}
        <aside className='flex flex-col min-w-0 order-3 xl:order-2 xl:justify-end'>
          <div className='pointer-events-auto w-full h-65 xl:h-85 min-w-0'>
            <MadrixControlPanel />
          </div>
        </aside>
      </div>
    </section>
  )
}

export default React.memo<Props>(OverallSection)
