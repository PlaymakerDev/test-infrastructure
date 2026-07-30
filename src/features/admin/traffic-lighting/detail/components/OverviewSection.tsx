"use client"
import React, { useEffect, useRef, useState } from 'react'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'
import VoltageAmpChartsRow from './VoltageAmpChartsRow'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import { MapEdgeFade } from '@/components/map/BaseMap'
import { useDetailContext } from '../context'

// Diagram wrapper's own fixed height (see the comment on that div below) —
// one of the three candidates the container's min-height maximizes over.
const DIAGRAM_HEIGHT = 400
// Diagram never renders taller than this even when the row grows well past
// it — a very large w×h made the backend-rendered SVG's own icons/labels
// spread out and overlap each other. The card's dark background still grows
// to the full row height regardless; only the diagram inside is capped.
const DIAGRAM_MAX_HEIGHT = 550
const DIAGRAM_PADDING = 24 // px, matches the `p-6` on the diagram card below

/** OVERVIEW tab layout — full-size diagram iframe with the remote control
 *  card (top-left) and status column (top-right) floating on top of it, like
 *  the overall page's map + corner stat cards. Below: charts + map/event
 *  section. */
const OverviewSection: React.FC = () => {
  const { imei, project, deviceLoaded } = useDetailContext()

  // RemoteControlCard (left) and StatusCardsColumn (right) are absolutely
  // positioned over the diagram, like the overall page's floating stat
  // cards — so this container's height has to be driven by the tallest of
  // the three by hand. ElectricalSystemCard's "แสดงข้อมูลทุกเฟส" expansion
  // makes the right column grow/shrink, so the reserved height must track
  // exactly how tall each side currently is — no fixed baseline — or it
  // either overlaps VoltageAmpChartsRow below (too short) or leaves a dead
  // gap above it (too tall).
  const [electricalExpanded, setElectricalExpanded] = useState(false)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const [leftColHeight, setLeftColHeight] = useState(0)
  const [rightColHeight, setRightColHeight] = useState(0)

  useEffect(() => {
    const leftEl = leftColRef.current
    const rightEl = rightColRef.current
    if (!leftEl || !rightEl) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === leftEl) setLeftColHeight(entry.contentRect.height)
        if (entry.target === rightEl) setRightColHeight(entry.contentRect.height)
      }
    })
    observer.observe(leftEl)
    observer.observe(rightEl)
    return () => observer.disconnect()
  }, [])

  const rowHeight = Math.max(leftColHeight, DIAGRAM_HEIGHT, rightColHeight)
  // Capped independently of the row/background height — see DIAGRAM_MAX_HEIGHT.
  const diagramHeight = Math.min(rowHeight - DIAGRAM_PADDING * 2, DIAGRAM_MAX_HEIGHT)

  return (
    <div className='w-full flex flex-col'>
      <div
        className='relative flex flex-col gap-3 md:min-h-(--electrical-min-h) transition-[min-height] duration-200'
        style={{ '--electrical-min-h': `${rowHeight}px` } as React.CSSProperties}
      >
        <div ref={leftColRef} className='w-full md:w-[429px] md:absolute md:top-0 md:left-0 md:z-10'>
          <RemoteControlCard />
        </div>

        {/* Center — circuit diagram card. `flex-1` so it keeps growing to
            match however tall the row currently is (matching the left/right
            columns), same as before. No background fill here anymore — a
            dark card behind a diagram that's capped shorter than the card
            (see DIAGRAM_MAX_HEIGHT) looked like a rectangle-in-a-rectangle;
            removing the fill means there's nothing to blend at the edges.
            The diagram itself is given an EXPLICIT capped height
            (diagramHeight, `items-center` below instead of stretch) instead
            of stretching to fill — a very tall row otherwise re-renders the
            backend SVG at an oversized w×h, which spread its icons/labels
            out until they overlapped each other. Width is untouched either
            way (`w-full` inside a fixed-width row), so this only ever
            changes vertically. */}
        <div className='relative flex-1 w-full min-w-0 flex items-center justify-center p-6'>
          {imei ? (
            // `relative` here (not on the outer card) so MapEdgeFade's %-based
            // fade is computed against the diagram's OWN height, not the full
            // card — otherwise, once the card grows much taller than the
            // capped diagram, the fade lands mostly in the blank padding
            // instead of softening the diagram's own top/bottom edge.
            <div className='relative w-full' style={{ height: diagramHeight }}>
              <DiagramIframe imei={imei} minHeight={DIAGRAM_HEIGHT - DIAGRAM_PADDING * 2} className='h-full' />
              <MapEdgeFade left={10} right={10} top={10} bottom={10} />
            </div>
          ) : (
            <p className='text-white/50 text-sm m-0 self-center'>ไม่มี IMEI — ไม่สามารถแสดงวงจรไฟฟ้าได้</p>
          )}
        </div>

        <div ref={rightColRef} className='w-full md:w-[300px] md:absolute md:top-0 md:right-0 md:z-10'>
          <StatusCardsColumn
            electricalExpanded={electricalExpanded}
            onToggleElectricalExpanded={() => setElectricalExpanded((v) => !v)}
          />
        </div>
      </div>
      <VoltageAmpChartsRow imei={imei} phase={project.phase} phaseReady={deviceLoaded} />
      <MapEventSection />
    </div>
  )
}

export default React.memo(OverviewSection)
