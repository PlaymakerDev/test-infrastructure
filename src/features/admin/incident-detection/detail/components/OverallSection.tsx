"use client"
import React from 'react'
import EventListSection from './sections/overall/EventListSection'
import MapSection from './sections/overall/MapSection'
import EventStatsSection from './sections/overall/EventStatsSection'
import EventDonutSection from './sections/overall/EventDonutSection'
import EventTrendSection from './sections/overall/EventTrendSection'
import DataDisplaySection from './sections/overall/DataDisplaySection'

interface Props {
  /** Jumps to the EVENTS tab — wired to "ดูเพิ่มเติม" in the event list. */
  onShowAllEvents?: () => void
}

/** Detail Tab 1 (ภาพรวม).
 *  • Mobile/tablet (< xl): map is a 50dvh block in normal flow, all cards
 *    stack below it as separate sections (no overlap).
 *  • xl+ desktop: map fills the section as the background and panels float
 *    over it as absolute overlays — event list (left), stat cards + donut +
 *    trend chart (right). */
const OverallSection: React.FC<Props> = ({ onShowAllEvents }) => {
  return (
    <div className='flex flex-col gap-6'>
      <section className='relative -mx-10 xl:h-180'>
        {/* Map. Mobile: fixed-height block (relative so BaseMap's absolute
          * inner div is bounded by THIS wrapper, not the section — otherwise
          * the map renders behind every card stacked below). xl+: absolute
          * inset-0 fills the section as the overlay background. */}
        <div className='relative h-[30dvh] sm:h-[40dvh] md:h-[50dvh] xl:h-auto xl:absolute xl:inset-0'>
          <MapSection />
        </div>

        {/* Mobile / tablet — every panel stacks BELOW the map. */}
        <div className='flex flex-col gap-4 pt-4 px-10 xl:hidden'>
          <EventStatsSection />
          <EventDonutSection />
          <EventTrendSection />
          <EventListSection onShowAll={onShowAllEvents} />
        </div>

        {/* xl+ overlays. Widths scale with viewport (xl: compact / 2xl: full
          * Figma size) so the map keeps a usable area in the middle. */}
        {/* Left rail — event list */}
        <aside
          className='hidden xl:flex flex-col absolute z-10 top-4 left-10 pointer-events-none xl:w-80 2xl:w-104'
          style={{ bottom: 16 }}
        >
          <div className='pointer-events-auto h-full min-h-0'>
            <EventListSection onShowAll={onShowAllEvents} />
          </div>
        </aside>

        {/* Right rail — stat cards on top, donut + line chart below */}
        <aside
          className='hidden xl:flex flex-col absolute z-10 top-4 right-10 gap-3 pointer-events-none xl:w-90 2xl:w-115'
          style={{ bottom: 16 }}
        >
          {/* Stat cards — narrower, pinned to the right edge of the rail */}
          <div className='pointer-events-auto self-end xl:w-55 2xl:w-66.5'>
            <EventStatsSection />
          </div>
          {/* Donut + line chart — full right-rail width. `shrink-0` wrappers keep
            * each card at its natural (content) height instead of h-full — the
            * chart cards were being squeezed shorter than their content, clipping
            * the line chart's x-axis at the bottom. Scrolls if they overflow. */}
          <div className='pointer-events-auto flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-3'>
            <div className='shrink-0'><EventDonutSection /></div>
            <div className='shrink-0'><EventTrendSection /></div>
          </div>
        </aside>
      </section>

      {/* Bottom — camera grid */}
      <section>
        <DataDisplaySection />
      </section>
    </div>
  )
}

export default React.memo(OverallSection)
